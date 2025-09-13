import User from "../models/User.js";

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
