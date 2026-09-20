// Build-time configuration. Values come from .env / the deploy script.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// India-ready default: 112 is India's unified emergency number (routes to
// police/fire/ambulance). Override per deployment with VITE_EMERGENCY_NUMBER
// and VITE_EMERGENCY_LABEL (e.g. 911/"US", 999/"UK", 000/"AU").
export const EMERGENCY_NUMBER = import.meta.env.VITE_EMERGENCY_NUMBER || '112';
export const EMERGENCY_LABEL = import.meta.env.VITE_EMERGENCY_LABEL || 'India';
