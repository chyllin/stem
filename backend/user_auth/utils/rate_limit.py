

import time
import redis

from django.http import HttpResponse


def check_progressive_rate_limit(identifier:str, ip_address):

    r = redis.Redis(host='127.0.0.1', port=6379, db=2, decode_responses=True)
    now = time.time()
    
    # Keys for both the user and the IP to prevent distributed attacks
    user_key = f"limit:req:u:{identifier}_{ip_address}"
    penalty_key = f"penalty:req:u:{identifier}_{ip_address}"
    
    # 1. Check if the user is currently in a "Hard Lockout"
    lockout_status = r.get(f"lockout:{identifier}_{ip_address}")
    if lockout_status:
        return True, "Too many requests. Try again later."

    # 2. Sliding Window Check (5 requests per 5 minutes)
    window_seconds = 300
    max_requests = 5
    
    pipe = r.pipeline()
    pipe.zremrangebyscore(user_key, 0, now - window_seconds)
    pipe.zadd(user_key, {str(now): now})
    pipe.zcard(user_key)
    pipe.expire(user_key, window_seconds + 60)
    results = pipe.execute()
    
    request_count = results[2]

    # 3. Handle Violations
    if request_count > max_requests:
        # Increment the "Violation Counter"
        violations = r.incr(penalty_key)
        r.expire(penalty_key, 86400) # Keep history for 24 hours
        
        # Calculate Exponential Backoff (5m, 10m, 20m, 40m...)
        base_penalty = 300 # 5 minutes
        wait_time = base_penalty * (2 ** (violations - 1)) #type:ignore
        
        # Set the Hard Lockout
        r.setex(f"lockout:{identifier}_{ip_address}", int(wait_time), "locked")
        
        return True, f"Too many requests. Try again in {int(wait_time/60)} minutes."

    return False, None



def simple_lockout_response(request, credentials, *args, **kwargs):
    
    """
    Returns only a 429 status code with an empty body.
    """
    return HttpResponse({"error": "Too many requests"}, status=429)