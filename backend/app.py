# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from routers.image_router import router as image_router
# from routers.video_router import router as video_router
# from routers.live_webcam_router import router as live_router
# from routers.drone_router import router as drone_router

# app = FastAPI(title="AI Plant Leaf Disease Detection")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# app.include_router(image_router)
# app.include_router(video_router)
# app.include_router(live_router)
# app.include_router(drone_router)



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.image_router import router as image_router
from routers.video_router import router as video_router
from routers.live_webcam_router import router as live_router
from routers.drone_router import router as drone_router

app = FastAPI(title="AI Plant Leaf Disease Detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,   
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_router)
app.include_router(video_router)
app.include_router(live_router)
app.include_router(drone_router)
