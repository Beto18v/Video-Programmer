import requests
import json

url = "http://127.0.0.1:8000/plan"
headers = {"Content-Type": "application/json"}
data = {
    "source_dir": "D:/Documentos/Repositories/Canva-app/video-programmer/storage/videos",
    "output_dir": "D:/Documentos/Repositories/Canva-app/video-programmer/storage/salida",
    "ordering": "name",
    "group_size": 3
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")