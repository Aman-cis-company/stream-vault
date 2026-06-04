const MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Registration successful. Please verify your email.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  TOKEN_REFRESHED: 'Token refreshed successfully.',
  FORGOT_PASSWORD_SUCCESS: 'Password reset instructions sent to your email.',
  RESET_PASSWORD_SUCCESS: 'Password reset successfully.',
  PROFILE_FETCHED: 'Profile fetched successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',

  // Auth Errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_INACTIVE: 'Your account has been deactivated. Please contact support.',
  ACCOUNT_BANNED: 'Your account has been banned.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  INVALID_TOKEN: 'Invalid or expired token.',
  TOKEN_REVOKED: 'Token has been revoked.',
  UNAUTHORIZED: 'Authentication required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INVALID_RESET_TOKEN: 'Invalid or expired password reset token.',

  // Category
  CATEGORY_CREATED: 'Category created successfully.',
  CATEGORY_UPDATED: 'Category updated successfully.',
  CATEGORY_DELETED: 'Category deleted successfully.',
  CATEGORY_FETCHED: 'Category fetched successfully.',
  CATEGORIES_FETCHED: 'Categories fetched successfully.',
  CATEGORY_NOT_FOUND: 'Category not found.',
  CATEGORY_SLUG_EXISTS: 'A category with this name already exists.',

  // Movie
  MOVIE_CREATED: 'Movie created successfully.',
  MOVIE_UPDATED: 'Movie updated successfully.',
  MOVIE_DELETED: 'Movie deleted successfully.',
  MOVIE_FETCHED: 'Movie fetched successfully.',
  MOVIES_FETCHED: 'Movies fetched successfully.',
  MOVIE_NOT_FOUND: 'Movie not found.',
  MOVIE_SLUG_EXISTS: 'A movie with this title already exists.',

  // Subscription
  SUBSCRIPTION_CREATED: 'Subscription created successfully.',
  SUBSCRIPTION_CANCELLED: 'Subscription cancelled successfully.',
  SUBSCRIPTION_FETCHED: 'Subscription status fetched.',
  NO_ACTIVE_SUBSCRIPTION: 'An active subscription is required to access this content.',
  CUSTOMER_CREATED: 'Customer created successfully.',
  CHECKOUT_SESSION_CREATED: 'Checkout session created successfully.',

  // Team Member
  TEAM_MEMBER_CREATED: 'Team member created successfully.',
  TEAM_MEMBER_UPDATED: 'Team member updated successfully.',
  TEAM_MEMBER_DELETED: 'Team member deleted successfully.',
  TEAM_MEMBER_FETCHED: 'Team member fetched successfully.',
  TEAM_MEMBERS_FETCHED: 'Team members fetched successfully.',
  TEAM_MEMBER_NOT_FOUND: 'Team member not found.',

  // Dashboard
  STATS_FETCHED: 'Dashboard stats fetched successfully.',
  REVENUE_FETCHED: 'Revenue data fetched successfully.',
  SUBSCRIBERS_FETCHED: 'Subscriber data fetched successfully.',
  PAYMENTS_FETCHED: 'Payments fetched successfully.',

  // Video streaming
  VIDEO_TOKEN_ISSUED: 'Video stream token issued.',
  VIDEO_NOT_LOCAL: 'Video is not stored locally; direct streaming is not available.',

  // Series
  SERIES_CREATED: 'Series created successfully.',
  SERIES_UPDATED: 'Series updated successfully.',
  SERIES_DELETED: 'Series deleted successfully.',
  SERIES_FETCHED: 'Series fetched successfully.',
  SERIES_NOT_FOUND: 'Series not found.',

  // Episodes
  EPISODE_CREATED: 'Episode created successfully.',
  EPISODE_UPDATED: 'Episode updated successfully.',
  EPISODE_DELETED: 'Episode deleted successfully.',
  EPISODE_FETCHED: 'Episode fetched successfully.',
  EPISODES_FETCHED: 'Episodes fetched successfully.',
  EPISODE_NOT_FOUND: 'Episode not found.',

  // Age verification
  AGE_VERIFIED: 'Age verified successfully.',
  AGE_VERIFICATION_FAILED: 'Age verification failed. You must be 18 or older.',
  AGE_STATUS_FETCHED: 'Age verification status fetched.',
  AGE_ALREADY_VERIFIED: 'Age already verified.',

  // Parental controls
  PARENTAL_CONTROLS_SAVED: 'Parental controls saved successfully.',
  PARENTAL_CONTROLS_FETCHED: 'Parental controls fetched successfully.',
  PARENTAL_CONTROLS_PIN_INVALID: 'Incorrect PIN.',

  // General
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Validation failed.',
  INTERNAL_ERROR: 'An internal server error occurred.',
  WEBHOOK_RECEIVED: 'Webhook received.',
  INVALID_WEBHOOK: 'Invalid webhook signature.',
};

module.exports = MESSAGES;
