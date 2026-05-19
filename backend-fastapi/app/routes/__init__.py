"""
Routes package
"""
from app.routes import diagnostic, maladies, patients, auth, metadata, consultations, diagnostics_history

__all__ = ['diagnostic', 'maladies', 'patients', 'auth', 'metadata', 'consultations', 'diagnostics_history']