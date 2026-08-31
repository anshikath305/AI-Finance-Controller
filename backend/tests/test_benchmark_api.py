import httpx
import asyncio

async def test_api():
    async with httpx.AsyncClient() as client:
        try:
            print("Testing /benchmarks/easy/run...")
            response = await client.post("http://localhost:8000/api/v1/benchmarks/easy/run", timeout=30.0)
            print(f"Status Code: {response.status_code}")
            if response.status_code != 200:
                print(f"Error Body: {response.text}")
            else:
                print("Success!")
        except Exception as e:
            print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
