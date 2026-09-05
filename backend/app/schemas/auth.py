from pydantic import BaseModel
from typing import List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    display_name: str
    organization_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    display_name: str
    role: str
    organization_name: str

    class Config:
        from_attributes = True
