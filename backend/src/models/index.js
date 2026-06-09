const { sequelize, Sequelize } = require('../config/database');

const Role = require('./Role');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Category = require('./Category');
const Movie = require('./Movie');
const SubscriptionPlan = require('./SubscriptionPlan');
const UserSubscription = require('./UserSubscription');
const Payment = require('./Payment');
const WatchHistory = require('./WatchHistory');
const UserAgeVerification = require('./UserAgeVerification');
const ParentalControl = require('./ParentalControl');
const Series = require('./Series');
const Episode = require('./Episode');
const UserInteraction = require('./UserInteraction');
const AffiliateCode = require('./AffiliateCode');
const ReferralConversion = require('./ReferralConversion');
const ContentComplianceRecord = require('./ContentComplianceRecord');

// ── Role ↔ User ─────────────────────────────────────────────────────────────
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// ── User ↔ RefreshToken ──────────────────────────────────────────────────────
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── User ↔ Category (created_by / updated_by) ────────────────────────────────
User.hasMany(Category, { foreignKey: 'created_by', as: 'createdCategories' });
User.hasMany(Category, { foreignKey: 'updated_by', as: 'updatedCategories' });
Category.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Category.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// ── Category ↔ Movie ─────────────────────────────────────────────────────────
Category.hasMany(Movie, { foreignKey: 'category_id', as: 'movies' });
Movie.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ── User ↔ Movie (created_by / updated_by) ───────────────────────────────────
User.hasMany(Movie, { foreignKey: 'created_by', as: 'createdMovies' });
User.hasMany(Movie, { foreignKey: 'updated_by', as: 'updatedMovies' });
Movie.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Movie.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// ── User ↔ UserSubscription ──────────────────────────────────────────────────
User.hasMany(UserSubscription, { foreignKey: 'user_id', as: 'subscriptions' });
UserSubscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── SubscriptionPlan ↔ UserSubscription ─────────────────────────────────────
SubscriptionPlan.hasMany(UserSubscription, { foreignKey: 'plan_id', as: 'userSubscriptions' });
UserSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });

// ── UserSubscription ↔ Payment ───────────────────────────────────────────────
UserSubscription.hasMany(Payment, { foreignKey: 'subscription_id', as: 'payments' });
Payment.belongsTo(UserSubscription, { foreignKey: 'subscription_id', as: 'subscription' });

// ── User ↔ Payment ───────────────────────────────────────────────────────────
User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── User ↔ WatchHistory ──────────────────────────────────────────────────────
User.hasMany(WatchHistory, { foreignKey: 'user_id', as: 'watchHistory', onDelete: 'CASCADE' });
WatchHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── Movie ↔ WatchHistory ─────────────────────────────────────────────────────
Movie.hasMany(WatchHistory, { foreignKey: 'movie_id', as: 'watchHistory' });
WatchHistory.belongsTo(Movie, { foreignKey: 'movie_id', as: 'movie' });

// ── Category ↔ Series ────────────────────────────────────────────────────────
Category.hasMany(Series, { foreignKey: 'category_id', as: 'seriesList' });
Series.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ── User ↔ Series (created_by / updated_by) ──────────────────────────────────
User.hasMany(Series, { foreignKey: 'created_by', as: 'createdSeries' });
User.hasMany(Series, { foreignKey: 'updated_by', as: 'updatedSeries' });
Series.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Series.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// ── Series ↔ Episode ─────────────────────────────────────────────────────────
Series.hasMany(Episode, { foreignKey: 'series_id', as: 'episodes', onDelete: 'CASCADE' });
Episode.belongsTo(Series, { foreignKey: 'series_id', as: 'series' });

// ── Episode ↔ WatchHistory ───────────────────────────────────────────────────
Episode.hasMany(WatchHistory, { foreignKey: 'episode_id', as: 'watchHistory' });
WatchHistory.belongsTo(Episode, { foreignKey: 'episode_id', as: 'episode' });

// ── User ↔ UserAgeVerification ───────────────────────────────────────────────
User.hasMany(UserAgeVerification, { foreignKey: 'user_id', as: 'ageVerifications', onDelete: 'CASCADE' });
UserAgeVerification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── User ↔ ParentalControl ───────────────────────────────────────────────────
User.hasOne(ParentalControl, { foreignKey: 'user_id', as: 'parentalControl', onDelete: 'CASCADE' });
ParentalControl.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── User ↔ UserInteraction ───────────────────────────────────────────────────
User.hasMany(UserInteraction, { foreignKey: 'user_id', as: 'interactions', onDelete: 'CASCADE' });
UserInteraction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── User ↔ AffiliateCode ─────────────────────────────────────────────────────
User.hasOne(AffiliateCode, { foreignKey: 'user_id', as: 'affiliateCode', onDelete: 'CASCADE' });
AffiliateCode.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── AffiliateCode ↔ ReferralConversion ──────────────────────────────────────
AffiliateCode.hasMany(ReferralConversion, { foreignKey: 'affiliate_code_id', as: 'conversions', onDelete: 'CASCADE' });
ReferralConversion.belongsTo(AffiliateCode, { foreignKey: 'affiliate_code_id', as: 'affiliateCode' });

// ── User ↔ ReferralConversion (referred user) ────────────────────────────────
User.hasOne(ReferralConversion, { foreignKey: 'referred_user_id', as: 'referralConversion', onDelete: 'CASCADE' });
ReferralConversion.belongsTo(User, { foreignKey: 'referred_user_id', as: 'referredUser' });

// ── Payment ↔ ReferralConversion ─────────────────────────────────────────────
Payment.hasOne(ReferralConversion, { foreignKey: 'payment_id', as: 'referralConversion' });
ReferralConversion.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

// ── Movie / Episode ↔ ContentComplianceRecord ────────────────────────────────
Movie.hasMany(ContentComplianceRecord, { foreignKey: 'movie_id', as: 'complianceRecords', onDelete: 'SET NULL' });
ContentComplianceRecord.belongsTo(Movie, { foreignKey: 'movie_id', as: 'movie' });
Episode.hasMany(ContentComplianceRecord, { foreignKey: 'episode_id', as: 'complianceRecords', onDelete: 'SET NULL' });
ContentComplianceRecord.belongsTo(Episode, { foreignKey: 'episode_id', as: 'episode' });

module.exports = {
  sequelize,
  Sequelize,
  Role,
  User,
  RefreshToken,
  Category,
  Movie,
  SubscriptionPlan,
  UserSubscription,
  Payment,
  WatchHistory,
  UserAgeVerification,
  ParentalControl,
  Series,
  Episode,
  UserInteraction,
  AffiliateCode,
  ReferralConversion,
  ContentComplianceRecord,
};
