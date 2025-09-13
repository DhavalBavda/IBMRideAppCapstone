from django.db import models
import uuid

class Admin(models.Model):
    admin_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=100, null=False)
    email = models.EmailField(max_length=50, primary_key=True)
    phone = models.CharField(max_length=15)
    password = models.CharField(max_length=255)  # store hashed password
    role = models.CharField(max_length=20, default='Admin')

    def __str__(self):
        return f"{self.name} ({self.email})"
