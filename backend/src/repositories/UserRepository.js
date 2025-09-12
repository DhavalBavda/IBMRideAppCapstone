import User from "../models/User.js";

<<<<<<< HEAD
export default class UserRepository {
    // Find user by UUID
    static async findById(uuid) {
        return await User.findByPk(uuid);
    }

    // Find user by email (useful for login)
    static async findByEmail(email) {
        return await User.findOne({
            where: { email },
        });
    }

    // Create a new user
    static async createUser(data) {
        return await User.create(data);
    }

    // Update user
    static async updateUser(uuid, data) {
        return await User.update(data, {
            where: { uuid },
            returning: true, // PostgreSQL style; for MySQL, you’ll need to refetch
        });
    }

    // Soft delete user (mark deleted_at instead of hard delete)
    static async softDeleteUser(uuid) {
        return await User.update(
            { deleted_at: new Date(), account_status: "deleted" },
            { where: { uuid } }
        );
    }

    // Hard delete user (only if needed)
    static async deleteUser(uuid) {
        return await User.destroy({
            where: { uuid },
        });
    }

    // Find drivers (for ride assignment)
    static async findDrivers() {
        return await User.findAll({
            where: { role: "driver", account_status: "active" },
        });
    }

    // Find riders (for verification if role === "rider")
    static async findRiders() {
        return await User.findAll({
            where: { role: "rider", account_status: "active" },
        });
    }
}
=======
class UserRepository {
  async findById(uuid) {
    return User.findByPk(uuid);
  }

  async findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  async findByPhone(phone) {
    return User.findOne({ where: { phone } });
  }

  async create(userData) {
    return User.create(userData);
  }

  async update(uuid, updateData) {
    const user = await this.findById(uuid);
    if (!user) return null;
    return user.update(updateData);
  }

  async delete(uuid) {
    const user = await this.findById(uuid);
    if (!user) return null;
    return user.destroy(); // soft delete if paranoid is true
  }
}

export default new UserRepository();
>>>>>>> 56732a10205196f7db58e34fe62721c7b71c4acc
