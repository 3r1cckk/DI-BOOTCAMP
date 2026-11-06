export const PERMISSION_DENIED_MESSAGE = 'You do not have permission to perform this action.';

export const SUPPORTED_ROLES = Object.freeze([
  'member',
  'treasurer',
  'secretary',
  'chairperson',
  'admin'
]);

export function requireRole(allowedRoles) {
  const allowed = new Set(allowedRoles);
  return (req, res, next) => {
    if (!req.auth) {
      res.status(401).json({ error: 'Please log in to continue.' });
      return;
    }
    if (!req.auth.membership || !allowed.has(req.auth.membership.role)) {
      res.status(403).json({ error: PERMISSION_DENIED_MESSAGE });
      return;
    }
    next();
  };
}

export function requireMembership(req, res, next) {
  if (!req.auth?.membership) {
    res.status(403).json({ error: PERMISSION_DENIED_MESSAGE });
    return;
  }
  next();
}
