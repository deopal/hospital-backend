/**
 * Base Repository
 * Generic CRUD operations that can be extended by specific repositories
 * Implements the Repository Pattern for data access abstraction
 */

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Create a new document
   */
  async create(data) {
    const document = new this.model(data);
    return await document.save();
  }

  /**
   * Find document by ID
   */
  async findById(id, options = {}) {
    const { select, populate } = options;
    let query = this.model.findById(id);

    if (select) {
      query = query.select(select);
    }

    if (populate) {
      query = query.populate(populate);
    }

    return await query.lean();
  }

  /**
   * Find one document matching criteria
   */
  async findOne(criteria, options = {}) {
    const { select, populate } = options;
    let query = this.model.findOne(criteria);

    if (select) {
      query = query.select(select);
    }

    if (populate) {
      query = query.populate(populate);
    }

    return await query.lean();
  }

  /**
   * Find all documents matching criteria
   */
  async find(criteria = {}, options = {}) {
    const {
      select,
      populate,
      sort = { createdAt: -1 },
      limit,
      skip
    } = options;

    let query = this.model.find(criteria);

    if (select) {
      query = query.select(select);
    }

    if (populate) {
      query = query.populate(populate);
    }

    if (sort) {
      query = query.sort(sort);
    }

    if (skip) {
      query = query.skip(skip);
    }

    if (limit) {
      query = query.limit(limit);
    }

    return await query.lean();
  }

  /**
   * Find with pagination
   */
  async findPaginated(criteria = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      select,
      populate,
      sort = { createdAt: -1 }
    } = options;

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.find(criteria, { select, populate, sort, limit, skip }),
      this.count(criteria)
    ]);

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update document by ID
   */
  async updateById(id, data, options = {}) {
    const { select, returnNew = true } = options;

    let query = this.model.findByIdAndUpdate(
      id,
      { $set: data },
      { new: returnNew, runValidators: true }
    );

    if (select) {
      query = query.select(select);
    }

    return await query;
  }

  /**
   * Update one document matching criteria
   */
  async updateOne(criteria, data, options = {}) {
    const { select, returnNew = true, upsert = false } = options;

    let query = this.model.findOneAndUpdate(
      criteria,
      { $set: data },
      { new: returnNew, runValidators: true, upsert }
    );

    if (select) {
      query = query.select(select);
    }

    return await query;
  }

  /**
   * Update many documents matching criteria
   */
  async updateMany(criteria, data) {
    return await this.model.updateMany(criteria, { $set: data });
  }

  /**
   * Delete document by ID
   */
  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  /**
   * Delete one document matching criteria
   */
  async deleteOne(criteria) {
    return await this.model.findOneAndDelete(criteria);
  }

  /**
   * Delete many documents matching criteria
   */
  async deleteMany(criteria) {
    return await this.model.deleteMany(criteria);
  }

  /**
   * Count documents matching criteria
   */
  async count(criteria = {}) {
    return await this.model.countDocuments(criteria);
  }

  /**
   * Check if document exists
   */
  async exists(criteria) {
    const result = await this.model.exists(criteria);
    return !!result;
  }
}

export default BaseRepository;
