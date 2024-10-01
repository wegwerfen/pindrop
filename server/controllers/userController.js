import models from '../models/index.js';
import supertokens from "supertokens-node";
import EmailPassword from "supertokens-node/recipe/emailpassword/index.js";
import UserMetadata from "supertokens-node/recipe/usermetadata";
import UserRoles from "supertokens-node/recipe/userroles";

const { User, Pin, sequelize } = models;

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['userId', 'firstname', 'lastname', 'email'],
      include: [
        {
          model: Pin,
          attributes: [[sequelize.fn('COUNT', sequelize.col('Pins.id')), 'pinCount']],
        },
      ],
      group: ['User.userId', 'User.firstname', 'User.lastname', 'User.email'],
    });

    const formattedUsers = users.map(user => ({
      id: user.userId,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      pinCount: user.Pins[0]?.dataValues.pinCount || 0,
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrCreateUser = async (req, res) => {
    try {
        const userId = req.session.getUserId();
        const tenantId = "public";

        const { metadata } = await UserMetadata.getUserMetadata(userId);
        const { roles } = await UserRoles.getRolesForUser(tenantId, userId);
        const isAdmin = roles.includes('Admin');

        const userInfo = await supertokens.getUser(userId);
        if (!userInfo) {
            return res.status(404).json({ error: "User not found in SuperTokens" });
        }
        const verified = userInfo.loginMethods[0]?.verified || false;

        let user = await User.findOne({ where: { userId: userId } });

        if (!user) {
            user = await User.create({
                userId: userId,
                email: userInfo.emails[0] || 'noemail@example.com',
                verified: verified,
                firstname: metadata.first_name || null,
                lastname: metadata.last_name || null,
                isAdmin: isAdmin,
                thirdParty: userInfo.loginMethods[0]?.thirdParty?.id || null,
            });
        } else {
            user.firstname = metadata.first_name || user.firstname;
            user.lastname = metadata.last_name || user.lastname;
            user.isAdmin = isAdmin;
            user.verified = verified;
            user.thirdParty = userInfo.loginMethods[0]?.thirdParty?.id || null;
            await user.save();
        }

        res.json({ user: user.toJSON() });
    } catch (error) {
        console.error('Error in getOrCreateUser:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const userId = req.session.getUserId();
        const { firstName, lastName } = req.body;

        await UserMetadata.updateUserMetadata(userId, {
            first_name: firstName,
            last_name: lastName
        });

        const user = await User.findOne({ where: { userId: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.firstname = firstName;
        user.lastname = lastName;
        await user.save();

        res.json({ message: "User information updated successfully", user: user.toJSON() });
    } catch (error) {
        console.error('Error in updateUser:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const session = req.session;
        const { oldPassword, newPassword } = req.body;

        const userInfo = await supertokens.getUser(session.getUserId());

        if (!userInfo) {
            return res.status(404).json({ error: "User not found" });
        }

        const loginMethod = userInfo.loginMethods.find(
            (lM) => lM.recipeUserId.getAsString() === session.getRecipeUserId().getAsString() && lM.recipeId === "emailpassword"
        );

        if (!loginMethod) {
            return res.status(400).json({ error: "User is not using email/password login" });
        }

        const email = loginMethod.email;

        const isPasswordValid = await EmailPassword.verifyCredentials(session.getTenantId(), email, oldPassword);

        if (isPasswordValid.status !== "OK") {
            return res.status(400).json({ error: "Incorrect old password" });
        }

        const response = await EmailPassword.updateEmailOrPassword({
            recipeUserId: session.getRecipeUserId(),
            password: newPassword,
            tenantIdForPasswordPolicy: session.getTenantId()
        });

        if (response.status === "PASSWORD_POLICY_VIOLATED_ERROR") {
            return res.status(400).json({ error: "New password does not meet policy requirements" });
        }

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error('Error in changePassword:', error);
        res.status(500).json({ error: "Internal server error" });
    }
};
