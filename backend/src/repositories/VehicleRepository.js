import Vehicle from "../models/Vehicle.js";

class VehicleRepository {
  async createVehicle(data) {
    return await Vehicle.create(data);
  }

  async findById(id) {
    return await Vehicle.findByPk(id);
  }

  async findByRegNumber(registration_number) {
    return await Vehicle.findOne({ where: { registration_number } });
  }

  async findByOwner(ownerId) {
    return await Vehicle.findAll({ where: { owner_id: ownerId } });
  }

  async updateVehicle(id, data) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;
    return await vehicle.update(data);
  }

  // async softDeleteVehicle(id) {
  //   const vehicle = await Vehicle.findByPk(id);
  //   if (!vehicle) return null;
  //   return await vehicle.update({ status: "inactive" });
  // }

  // Soft delete
  async softDeleteVehicle(id) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;
    return await vehicle.update({
      status: "inactive",
      is_deleted: true,
    });
  }

  // Reactivate (admin or explicit endpoint)
  async reactivateVehicle(id) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return null;
    return await vehicle.update({
      status: "active",
      is_deleted: false,
    });
  }
}

export default new VehicleRepository();
