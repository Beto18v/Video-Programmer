# Role constants for the Video Programmer system
# This system supports exactly 2 roles: ADMIN and CLIENT

ADMIN_ROLE_ID = 1
CLIENT_ROLE_ID = 2

ADMIN_ROLE_NAME = "admin"
CLIENT_ROLE_NAME = "cliente"

# Available roles dictionary: id -> name
ROLES = {
    ADMIN_ROLE_ID: ADMIN_ROLE_NAME,
    CLIENT_ROLE_ID: CLIENT_ROLE_NAME
}

# List of valid role names
ROLE_NAMES = [ADMIN_ROLE_NAME, CLIENT_ROLE_NAME]

# Default role for new users
DEFAULT_ROLE_ID = CLIENT_ROLE_ID