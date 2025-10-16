/**
 * User Management Routes Module
 *
 * Admin-only endpoints for managing users
 */

import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateRequest } from "../../lib/validation.js";
import { userController } from "./users.controller.js";
import {
  requireAuthOrApiKey,
  requireAdmin,
} from "../../lib/auth/auth.middleware.js";
import { updateUserSchema } from "./users.schemas.js";

const router: Router = Router();

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
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of users to return
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                         nullable: true
 *                       displayName:
 *                         type: string
 *                         nullable: true
 *                       avatar:
 *                         type: string
 *                         nullable: true
 *                       role:
 *                         type: string
 *                         enum: [SUPER_ADMIN, ADMIN, USER, GUEST]
 *                       isPasswordless:
 *                         type: boolean
 *                       isActive:
 *                         type: boolean
 *                       isLocked:
 *                         type: boolean
 *                       lastLoginAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 */
router.get(
  "/",
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     displayName:
 *                       type: string
 *                       nullable: true
 *                     avatar:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: string
 *                       enum: [SUPER_ADMIN, ADMIN, USER, GUEST]
 *                     isPasswordless:
 *                       type: boolean
 *                     isActive:
 *                       type: boolean
 *                     isLocked:
 *                       type: boolean
 *                     lastLoginAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */
router.get(
  "/:userId",
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               displayName:
 *                 type: string
 *               avatar:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, USER, GUEST]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     displayName:
 *                       type: string
 *                       nullable: true
 *                     role:
 *                       type: string
 *                       enum: [SUPER_ADMIN, ADMIN, USER, GUEST]
 *                     isActive:
 *                       type: boolean
 */
router.put(
  "/:userId",
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.delete(
  "/:userId",
  requireAuthOrApiKey,
  requireAdmin,
  asyncHandler(userController.deleteUser.bind(userController))
);

export default router;
