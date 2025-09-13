from rest_framework import serializers
from .models import Admin
from django.contrib.auth.hashers import make_password, check_password


class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = ['admin_id', 'name', 'email', 'phone', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True}  # don't expose password in API response
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super(AdminSerializer, self).create(validated_data)

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            validated_data['password'] = make_password(validated_data['password'])
        return super(AdminSerializer, self).update(instance, validated_data)


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        try:
            admin = Admin.objects.get(email=data['email'])
        except Admin.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password")
        
        if not check_password(data['password'], admin.password):
            raise serializers.ValidationError("Invalid email or password")

        return admin


class AdminUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = ['name', 'phone']  # Only allow updating these