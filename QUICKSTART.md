# InstallSure Golden Path v2.0 - Quick Start

## 🚀 One-Command Setup

### Windows (PowerShell)
```powershell
.\scripts\win\bootstrap.ps1
```

### macOS/Linux
```bash
bash scripts/unix/bootstrap.sh
```

## 🌐 Access Your Application

After bootstrap completes:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432 (user: postgres, pass: postgres)
- **Redis**: localhost:6379

## 🔧 Manual Commands

```bash
# Start services
make dev

# Stop services  
make stop

# View logs
docker compose logs -f backend
docker compose logs -f bim

# Run tests
cd backend && pytest
```

## 📦 What's Included

✅ **Backend API** (FastAPI on port 8000)
- Authentication (JWT)
- Projects CRUD
- File uploads
- QTO processing
- Drone scan management

✅ **BIM Worker** (Background processing)
- IFC file parsing
- Quantity takeoffs
- Auto-takeoff
- Plan diff
- Similarity search

✅ **Frontend** (React on port 5173)
- IFC viewer
- QTO table
- Auto-takeoff review
- Plan diff toggle
- Scan overlay

## 📚 Documentation

- [BUILD_GUIDE.md](docs/BUILD_GUIDE.md) - Development guide
- [GOLDEN_PATH_V2.md](GOLDEN_PATH_V2.md) - Complete architecture
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementation details

## 🎯 Next Steps

1. Explore the API at http://localhost:8000/docs
2. Test authentication endpoints
3. Upload a sample IFC file
4. Review the frontend components
5. Start developing new features!

## ❓ Issues?

Check the main documentation files or open an issue on GitHub.

---

**Status**: ✅ Ready for Development
**Version**: 2.0.0
