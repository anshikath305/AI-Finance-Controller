import time
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from fastapi import HTTPException, Request, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.database import User, Membership, Organization

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "finance-ops-super-secret-key-for-dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day for dev

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

class RateLimiter:
    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = requests_per_minute
        self.user_requests: Dict[str, List[float]] = {}

    async def check_rate_limit(self, request: Request):
        identifier = request.client.host
        now = time.time()
        if identifier not in self.user_requests:
            self.user_requests[identifier] = []
        self.user_requests[identifier] = [t for t in self.user_requests[identifier] if now - t < 60]
        if len(self.user_requests[identifier]) >= self.requests_per_minute:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again in a minute.")
        self.user_requests[identifier].append(now)

rate_limiter = RateLimiter(requests_per_minute=10)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check query param if header is missing
    actual_token = token
    if not actual_token:
        actual_token = request.query_params.get("token")
        
    if not actual_token:
        raise credentials_exception

    try:
        payload = jwt.decode(actual_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

async def get_current_active_membership(
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # For MVP, we take the first organization the user is a member of
    membership = db.query(Membership).filter(Membership.user_id == user.id).first()
    if not membership:
        raise HTTPException(status_code=403, detail="User is not a member of any organization")
    return membership

class PermissionChecker:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions

    def __call__(self, membership: Membership = Depends(get_current_active_membership)):
        # Role to Permissions Map
        ROLE_PERMISSIONS = {
            "ADMIN": ["VIEW_RUN", "CREATE_RUN", "REVIEW_EXCEPTION", "RESOLVE_EXCEPTION", "ASSIGN_EXCEPTION", "EXPORT_REPORT", "VIEW_AUDIT", "VIEW_INTELLIGENCE", "VIEW_OPERATIONS", "RUN_BENCHMARK", "MANAGE_POLICY", "MANAGE_USERS", "MANAGE_WORKSPACE", "VIEW_COPILOT"],
            "FINANCE_MANAGER": ["VIEW_RUN", "CREATE_RUN", "REVIEW_EXCEPTION", "RESOLVE_EXCEPTION", "ASSIGN_EXCEPTION", "EXPORT_REPORT", "VIEW_AUDIT", "VIEW_INTELLIGENCE", "VIEW_OPERATIONS", "MANAGE_POLICY", "VIEW_COPILOT"],
            "REVIEWER": ["VIEW_RUN", "REVIEW_EXCEPTION", "RESOLVE_EXCEPTION", "ASSIGN_EXCEPTION", "EXPORT_REPORT", "VIEW_AUDIT", "VIEW_INTELLIGENCE", "VIEW_OPERATIONS", "VIEW_COPILOT"],
            "VIEWER": ["VIEW_RUN", "EXPORT_REPORT", "VIEW_AUDIT", "VIEW_INTELLIGENCE", "VIEW_OPERATIONS", "VIEW_COPILOT"],
            "AUDITOR": ["VIEW_RUN", "EXPORT_REPORT", "VIEW_AUDIT", "VIEW_INTELLIGENCE", "VIEW_OPERATIONS"]
        }
        
        user_permissions = ROLE_PERMISSIONS.get(membership.role, [])
        for perm in self.required_permissions:
            if perm not in user_permissions:
                raise HTTPException(status_code=403, detail=f"Permission denied: {perm}")
        return True
