"""
    Description
        Running multiple requests in parallel can cause the whole container to crash.
        This happens due to a race condition within the cleanup, where killing the
        process removes the file, but before this happens we have already marked 
        the file for deletion
    
    Resolution
        Catching any errors resulting from individual file deletes in the
        filesystem cleanup.
    
"""
import aiohttp
import asyncio

def get_request_data(message):
    return {
        'language': 'java',
        'version': '15.0.2',
        'files': [
            {
                'name': 'Test.java',
                'content': 'public class HelloWorld { public static void main(String[] args) { System.out.print("' + message + '"); }}'
            }
        ],
        'stdin': '',
        'args': [],
        'compile_timeout': 10000,
        'run_timeout': 3000
    }

async def post_request(session, data):
    async with session.post('http://127.0.0.1:2000/api/v2/execute', json=data) as resp:
        response = await resp.json()
        return response

async def run_many_requests(number):
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(number):
            request_data = get_request_data(f"Request #{i}")
            tasks.append(asyncio.ensure_future(post_request(session, request_data)))

        results = await asyncio.gather(*tasks)
        for result in results:
            print(result)
            

asyncio.run(run_many_requests(5))