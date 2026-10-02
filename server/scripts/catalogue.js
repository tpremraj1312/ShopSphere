/**
 * Canonical ShopSphere catalogue registry.
 *
 * Seed scripts should import this module instead of importing individual
 * catalogue fragments. The fragments remain data-only modules so existing
 * deployments can be migrated without duplicating product records.
 */
const { sellers, reviewerProfiles } = require('./catalog-data');
const { categoryPhotos } = require('./catalog-templates');

const departments = [
  ...require('./catalog-extra'),
  ...require('./catalog-extra-more'),
  ...require('./catalog-extra-final')
];

module.exports = {
  sellers,
  reviewerProfiles,
  categoryPhotos,
  departments
};
