import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Building.router import router as router_building
from config import settings
from Contract.router import router as router_contract
from Database.router import router as router_database
from Equipment.router import router as router_equipment
from EquipmentSpecification.router import router as router_equipment_specs
from EquipmentStatus.router import router as router_equipment_status
from EquipmentStatusType.router import \
    router as router_equipment_status_type
from EquipmentType.router import router as router_equipment_type
from Job.router import router as router_jobs
from License.router import router as router_license
from Office.router import router as router_offices
from ResponsibleUser.router import router as router_responsible_user
from SessionLog.router import router as router_session_log
from Software.router import router as router_software
from SystemRole.router import router as router_roles
from User.router import router as router_auth
from User.user_router import router as router_users

app = FastAPI(
    title="SATS"
)

app.include_router(router_roles)
app.include_router(router_auth)
app.include_router(router_users)
app.include_router(router_jobs)
app.include_router(router_offices)
app.include_router(router_license)
app.include_router(router_contract)
app.include_router(router_software)
app.include_router(router_session_log)
app.include_router(router_equipment_status_type)
app.include_router(router_building)
app.include_router(router_responsible_user)
app.include_router(router_equipment_type)
app.include_router(router_equipment)
app.include_router(router_equipment_specs)
app.include_router(router_equipment_status)
app.include_router(router_database)


origins = (settings.APP_CORS_ORIGINS).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)