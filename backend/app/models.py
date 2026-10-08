# Import every domain before configuring mappers or Alembic metadata.
from app.appointments.models import Appointment
from app.kitchen_configurations.models import KitchenConfiguration
from app.leads.models import Lead
from app.properties.models import Property, PropertyImage

__all__ = ["Appointment", "KitchenConfiguration", "Lead", "Property", "PropertyImage"]

from app.auth.models import AdminSession, AdminUser, LoginLimit

__all__ += ["AdminSession", "AdminUser", "LoginLimit"]
