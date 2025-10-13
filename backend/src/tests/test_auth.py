def test_register_user(client):
    """Test user registration"""
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "testpass123", "full_name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
