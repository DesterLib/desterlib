/**
 * Authentication Routes Module
 *
 * Exports the authentication router
 */

import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateRequest } from "../../lib/validation.js";
import { userController } from "../../lib/auth/user.controller.js";
import {
  requireAuth,
  requireAdmin,
  requireAuthOrApiKey,
} from "../../lib/auth/auth.middleware.js";
import {
  createUserSchema,
  loginSchema,
  passwordlessLoginSchema,
  refreshTokenSchema,
  updateUserSchema,
  changePasswordSchema,
  changePinSchema,
  createApiKeySchema,
  updateApiKeySchema,
} from "../../lib/auth/auth.schemas.js";

const router: Router = Router();

// ────────────────────────────────────────────────────────────────────────────
// Public Authentication Routes
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               displayName:
 *                 type: string
 *                 example: John Doe
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *               pin:
 *                 type: string
 *                 example: "1234"
 *               isPasswordless:
 *                 type: boolean
 *                 default: false
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER, GUEST]
 *                 default: USER
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post(
  "/register",
  validateRequest({ body: createUserSchema }),
  asyncHandler(userController.register.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with username and password or PIN
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  "/login",
  validateRequest({ body: loginSchema }),
  asyncHandler(userController.login.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/login/passwordless:
 *   post:
 *     tags: [Authentication]
 *     summary: Login without password (passwordless accounts only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  "/login/passwordless",
  validateRequest({ body: passwordlessLoginSchema }),
  asyncHandler(userController.loginPasswordless.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post(
  "/refresh",
  validateRequest({ body: refreshTokenSchema }),
  asyncHandler(userController.refresh.bind(userController))
);

// ────────────────────────────────────────────────────────────────────────────
// Protected Authentication Routes (Require Auth)
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout current session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post(
  "/logout",
  requireAuthOrApiKey,
  validateRequest({ body: refreshTokenSchema }),
  asyncHandler(userController.logout.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout all sessions
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: All sessions logged out successfully
 */
router.post(
  "/logout-all",
  requireAuthOrApiKey,
  asyncHandler(userController.logoutAll.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user information
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 */
router.get(
  "/me",
  requireAuthOrApiKey,
  asyncHandler(userController.getCurrentUser.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   put:
 *     tags: [Authentication]
 *     summary: Update current user
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put(
  "/me",
  requireAuthOrApiKey,
  validateRequest({ body: updateUserSchema }),
  asyncHandler(userController.updateCurrentUser.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post(
  "/change-password",
  requireAuthOrApiKey,
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(userController.changePassword.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/change-pin:
 *   post:
 *     tags: [Authentication]
 *     summary: Change PIN
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: PIN changed successfully
 */
router.post(
  "/change-pin",
  requireAuthOrApiKey,
  validateRequest({ body: changePinSchema }),
  asyncHandler(userController.changePin.bind(userController))
);

// ────────────────────────────────────────────────────────────────────────────
// Session Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     tags: [Authentication]
 *     summary: Get all active sessions
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 */
router.get(
  "/sessions",
  requireAuthOrApiKey,
  asyncHandler(userController.getSessions.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/sessions/{sessionId}:
 *   delete:
 *     tags: [Authentication]
 *     summary: Revoke a specific session
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session revoked successfully
 */
router.delete(
  "/sessions/:sessionId",
  requireAuthOrApiKey,
  asyncHandler(userController.revokeSession.bind(userController))
);

// ────────────────────────────────────────────────────────────────────────────
// API Key Management
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/api-keys:
 *   get:
 *     tags: [API Keys]
 *     summary: List all API keys
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get(
  "/api-keys",
  requireAuth, // API keys can't manage themselves
  asyncHandler(userController.listApiKeys.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/api-keys:
 *   post:
 *     tags: [API Keys]
 *     summary: Create a new API key
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: API key created successfully
 */
router.post(
  "/api-keys",
  requireAuth,
  validateRequest({ body: createApiKeySchema }),
  asyncHandler(userController.createApiKey.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/api-keys/{keyId}:
 *   get:
 *     tags: [API Keys]
 *     summary: Get a specific API key
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: keyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key details
 */
router.get(
  "/api-keys/:keyId",
  requireAuth,
  asyncHandler(userController.getApiKey.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/api-keys/{keyId}:
 *   put:
 *     tags: [API Keys]
 *     summary: Update an API key
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: keyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key updated successfully
 */
router.put(
  "/api-keys/:keyId",
  requireAuth,
  validateRequest({ body: updateApiKeySchema }),
  asyncHandler(userController.updateApiKey.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/api-keys/{keyId}:
 *   delete:
 *     tags: [API Keys]
 *     summary: Delete an API key
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: keyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key deleted successfully
 */
router.delete(
  "/api-keys/:keyId",
  requireAuth,
  asyncHandler(userController.deleteApiKey.bind(userController))
);

/**
 * @swagger
 * /api/v1/auth/api-keys/{keyId}/revoke:
 *   post:
 *     tags: [API Keys]
 *     summary: Revoke an API key
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: keyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key revoked successfully
 */
router.post(
  "/api-keys/:keyId/revoke",
  requireAuth,
  asyncHandler(userController.revokeApiKey.bind(userController))
);

// ────────────────────────────────────────────────────────────────────────────
// User Management (Admin Only)
// ────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (admin only)
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get(
  "/users",
  requireAuthOrApiKey,
  requireAdmin,
  asyncHandler(userController.listUsers.bind(userController))
);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (admin only)
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get(
  "/users/:userId",
  requireAuthOrApiKey,
  requireAdmin,
  asyncHandler(userController.getUserById.bind(userController))
);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   put:
 *     tags: [Users]
 *     summary: Update user (admin only)
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put(
  "/users/:userId",
  requireAuthOrApiKey,
  requireAdmin,
  validateRequest({ body: updateUserSchema }),
  asyncHandler(userController.updateUser.bind(userController))
);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (admin only)
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete(
  "/users/:userId",
  requireAuthOrApiKey,
  requireAdmin,
  asyncHandler(userController.deleteUser.bind(userController))
);

export default router;
