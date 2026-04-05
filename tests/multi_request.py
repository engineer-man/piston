"""
    Description
        Running multiple requests in parallel can cause the whole container to crash.
        This happens due to a race condition within the cleanup, where killing the
        process removes the file, but before this happens we have already marked 
        the file for deletion
    
    Resolution
        Refactored api/job.js to properly await isolate --cleanup before 
        removing metadata files.
    
"""
import aiohttp
import asyncio
import os

# Piston API Key from environment
PISTON_KEY = os.environ.get('PISTON_KEY')

def get_request_data(message):
    return {
        'language': 'python',
        'version': '3.12.0',
        'files': [
            {
                'name': 'test.py',
                'content': f'print("{message}")'
            }
        ],
        'stdin': '',
        'args': [],
        'compile_timeout': 10000,
        'run_timeout': 3000
    }

async def post_request(session, data):
    headers = {'Content-Type': 'application/json'}
    if PISTON_KEY:
        headers['Authorization'] = PISTON_KEY
        
    async with session.post('http://127.0.0.1:2000/api/v2/execute', json=data, headers=headers) as resp:
        if resp.status == 401:
            return {'error': 'Unauthorized: Check your PISTON_KEY'}
        try:
            response = await resp.json()
            return response
        except Exception as e:
            return {'error': f'Failed to parse JSON: {str(e)}', 'status': resp.status}

async def run_many_requests(number):
    async with aiohttp.ClientSession() as session:
        print(f"🚀 Sending {number} parallel requests to Piston...")
        if PISTON_KEY:
            print("🔑 Using API Key authentication")
        
        tasks = []
        for i in range(number):
            request_data = get_request_data(f"Request #{i}")
            tasks.append(asyncio.ensure_future(post_request(session, request_data)))

        results = await asyncio.gather(*tasks)
        
        success_count = 0
        for i, result in enumerate(results):
            if 'run' in result and result['run']['code'] == 0:
                success_count += 1
            else:
                print(f"❌ Request #{i} failed: {result.get('error') or result.get('message') or result}")

        print(f"\n✅ Finished! {success_count}/{number} requests succeeded.")
            

if __name__ == "__main__":
    asyncio.run(run_many_requests(20))