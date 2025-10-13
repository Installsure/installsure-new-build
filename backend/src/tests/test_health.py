def test_healthz(client):
    """Test health check endpoint"""
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
