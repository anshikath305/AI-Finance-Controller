import time
from typing import Dict, Tuple
from fastapi import HTTPException, Request

class RateLimiter:
    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = requests_per_minute
        self.user_requests: Dict[str, List[float]] = {}

    async def check_rate_limit(self, request: Request):
        # Use client IP as identifier for MVP
        identifier = request.client.host
        now = time.time()

        if identifier not in self.user_requests:
            self.user_requests[identifier] = []

        # Clean up old requests
        self.user_requests[identifier] = [
            t for t in self.user_requests[identifier] if now - t < 60
        ]

        if len(self.user_requests[identifier]) >= self.requests_per_minute:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again in a minute.")

        self.user_requests[identifier].append(now)

rate_limiter = RateLimiter(requests_per_minute=10)
