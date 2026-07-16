const axios = require('axios');
const { Op } = require('sequelize');
const { Movie, Series, Category, ParentalControl, SubscriptionPlan } = require('../../models');
const UserInteractionRepository = require('../repositories/UserInteractionRepository');

class UserInteractionService {
  async getStatus(userId, contentType, contentId) {
    const record = await UserInteractionRepository.findOne(userId, contentType, Number(contentId));
    return {
      is_liked: record?.is_liked ?? false,
      in_list: record?.in_list ?? false,
    };
  }

  async toggleLike(userId, contentType, contentId) {
    const record = await UserInteractionRepository.upsertToggleLike(userId, contentType, Number(contentId));
    return { is_liked: record.is_liked };
  }

  async toggleList(userId, contentType, contentId) {
    const record = await UserInteractionRepository.upsertToggleList(userId, contentType, Number(contentId));
    return { in_list: record.in_list };
  }

  async getMyList(userId) {
    return UserInteractionRepository.getList(userId);
  }

  async getLiked(userId) {
    return UserInteractionRepository.getLiked(userId);
  }

  async chat(userId, message) {
    const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const [movies, series, plans] = await Promise.all([
          Movie.findAll({ where: { status: 'published' }, limit: 100, attributes: ['title', 'description', 'content_rating', 'slug', 'language'] }),
          Series.findAll({ where: { status: 'published' }, limit: 100, attributes: ['title', 'description', 'content_rating', 'slug', 'language'] }),
          SubscriptionPlan.findAll({ where: { status: 'active' }, attributes: ['name', 'price', 'billing_cycle'] })
        ]);

        const systemPrompt = `You are VaultAssistant, the premium conversational AI guide for StreamVault.
Your role is to help users find movies/series, summarize plots, and handle support queries.

Here is the current live information about StreamVault:
1. Available Movies:
${movies.map(m => `- ${m.title}: ${m.description || 'No description'} (Language: ${m.language || 'English'}, Rating: ${m.content_rating || 'G'}, Link: /watch/${m.slug})`).join('\n')}

2. Available Web Series:
${series.map(s => `- ${s.title}: ${s.description || 'No description'} (Language: ${s.language || 'English'}, Rating: ${s.content_rating || 'G'}, Link: /series/${s.slug})`).join('\n')}

3. Active Subscription Plans:
${plans.map(p => `- ${p.name}: $${p.price}/${p.billing_cycle}`).join('\n')}

4. Support Guide:
- To enable or change the parental PIN: Go to /settings/parental-controls, check 'Enable parental PIN protection', enter 4 digits, and select a max rating.
- To view billing details and invoices: Go to /profile?tab=billing.
- To change password: Go to /profile, scroll to 'Change Password' section, fill in current password and new password (min 6 chars), and click 'Update password'.
- To change profile name: Go to /profile, under 'Account Information', edit First/Last name, and click 'Save changes'.
- To view saved, bookmarked, or liked movies/series: Go to the "My List" page at /my-list in the top navigation. Here you will find all movies/series where you have clicked the 'My List' button.
- Profile Photo / Avatar: StreamVault uses dynamically generated initial-based gradient avatars (using the user's name initial and a custom hue value). There is no manual image upload feature for avatars.
- General library: /library

Instructions:
- Provide friendly, concise, and helpful answers in Markdown.
- If recommending content, prioritize the available content listed above and include their exact markdown links (e.g. [Movie Title](/watch/slug-name)).
- Do not mention that this data is pre-provided or that you are looking at a context database. Simply answer as if you know it naturally.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
        const response = await axios.post(url, {
          contents: [
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        }, {
          timeout: 20000
        });

        const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return reply;
        }
      } catch (err) {
        console.error('Gemini API call failed, falling back to local chat engine:', err.message);
      }
    }

    return this.chatLocal(userId, message);
  }

  async chatLocal(userId, message) {
    const text = message.toLowerCase().trim();

    // Detect language filter
    const languages = ['english', 'hindi', 'tamil', 'telugu', 'spanish', 'korean', 'malayalam', 'kannada', 'bengali', 'marathi', 'gujarati', 'punjabi'];
    let languageFilter = null;
    for (const lang of languages) {
      if (text.includes(lang)) {
        languageFilter = lang;
        break;
      }
    }

    // 1. Parental controls PIN intent
    if (text.includes('pin') || text.includes('parental') || text.includes('restrict')) {
      return `To manage parental controls and your parental PIN on StreamVault:
1. Navigate to the **[Parental Controls Settings](/settings/parental-controls)** page.
2. Check the box to **'Enable parental PIN protection'** if you want to require a 4-digit PIN for restricted content.
3. Enter a 4-digit PIN and select your desired **Maximum Allowed Age Rating** (G, PG, PG-13, 16+, 18+).
4. Click **'Save Changes'**.

*Note: If you have already set up a PIN, you will need to provide your current PIN to modify these settings.*`;
    }

    // 1.5 Profile updates, password and avatar intents
    if (text.includes('password')) {
      return `To change or update your password on StreamVault:
1. Go to your **[Profile & Security Settings](/profile)** page.
2. Scroll down to the **'Change Password'** section.
3. Enter your current password and your new password (must be at least 6 characters).
4. Click the **'Update password'** button.

*Note: If you have forgotten your password and cannot log in, you can request a reset link on the [Forgot Password](/forgot-password) page.*`;
    }

    if (text.includes('photo') || text.includes('picture') || text.includes('avatar') || text.includes('upload')) {
      return `On StreamVault, user profile avatars are **automatically generated** using a premium color gradient and the initial of your first name.

Currently, there is no manual image upload feature for profile photos. Your avatar's style is kept uniform and clean automatically across the streaming dashboard based on your account settings.`;
    }

    if (text.includes('change name') || text.includes('update name') || text.includes('update profile') || text.includes('edit profile')) {
      return `To update your profile information (like your name):
1. Go to your **[Profile & Security Settings](/profile)** page.
2. Under the **'Account Information'** card, edit your First Name or Last Name.
3. Click the **'Save changes'** button.

*Note: If you need to change your registered Email address, please contact support.*`;
    }

    if (text.includes('liked') || text.includes('my list') || text.includes('watchlist') || text.includes('favorite') || text.includes('bookmark') || text.includes('saved')) {
      return `To view your saved, bookmarked, or liked movies and series on StreamVault:
1. Make sure you are logged in to your account.
2. In the top navigation bar, click on **[My List](/my-list)**.
3. On this page, you will find all the movies and web series that you have saved by clicking the **'My List'** bookmark button on their detail or watch page.

*Note: Clicking the thumbs-up **'Like'** button on a watch page marks it as liked, while the **'My List'** button bookmarks it to your personal list for quick access.*`;
    }

    // 2. Subscription / Plans intent
    if (text.includes('subscribe') || text.includes('plan') || text.includes('price') || text.includes('pricing') || text.includes('billing') || text.includes('upgrade') || text.includes('cost')) {
      try {
        const plans = await SubscriptionPlan.findAll({ where: { status: 'active' } });
        if (plans && plans.length > 0) {
          const planList = plans.map(p => `* **${p.name}**: $${p.price}/${p.billing_cycle} - ${p.description || 'Access to stream content'}`).join('\n');
          return `Here are the active subscription plans available on StreamVault:

${planList}

You can manage your subscription, view invoices, or update your payment details directly in the **[Billing & Invoices](/profile?tab=billing)** section of your profile.`;
        }
      } catch (err) {
        // Fallback pricing if DB query fails
      }
      return `StreamVault offers flexible monthly and yearly subscription plans.
You can view all current plans, select the one that fits your needs, and subscribe on the **[Plans & Pricing](/pricing)** page. Or check your current plan details under **[Billing & Invoices](/profile?tab=billing)**.`;
    }

    // 3. Movie/Series Plot Summary intent
    let plotMatch = null;
    if (text.includes('about')) {
      plotMatch = message.replace(/what\s+is\s+/i, '').replace(/about\??/i, '').trim();
    } else if (text.includes('summarize')) {
      plotMatch = message.replace(/summarize\s+the\s+plot\s+of/i, '').replace(/summarize/i, '').trim();
    } else if (text.includes('plot of')) {
      plotMatch = message.replace(/plot\s+of/i, '').trim();
    }

    if (plotMatch && plotMatch.length > 2) {
      const titleQuery = plotMatch.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim();
      const movie = await Movie.findOne({
        where: {
          title: { [Op.like]: `%${titleQuery}%` }
        }
      });
      if (movie) {
        return `Here is a summary of the movie **${movie.title}** (Content Rating: ${movie.content_rating || 'G'}):

${movie.description || 'No description available.'}

[Watch Now](/watch/${movie.slug || movie.id})`;
      }

      const series = await Series.findOne({
        where: {
          title: { [Op.like]: `%${titleQuery}%` }
        }
      });
      if (series) {
        return `Here is a summary of the web series **${series.title}** (Content Rating: ${series.content_rating || 'G'}):

${series.description || 'No description available.'}

[Explore Series](/series/${series.slug || series.id})`;
      }
    }
    // 4. Recommendations / Similar to / Genre Suggestion intent
    if (text.includes('recommend') || text.includes('suggest') || text.includes('similar') || text.includes('movie') || text.includes('series') || text.includes('show')) {
      let genreMatched = null;
      try {
        const categories = await Category.findAll();
        for (const cat of categories) {
          if (text.includes(cat.name.toLowerCase()) || text.includes(cat.slug.toLowerCase())) {
            genreMatched = cat;
            break;
          }
        }
      } catch (e) {}

      let similarTitle = null;
      const similarMatch = message.match(/similar\s+to\s+([^?.]+)/i);
      if (similarMatch && similarMatch[1]) {
        similarTitle = similarMatch[1].trim();
      }

      // Extract search keywords from the query
      const stopWords = ['give', 'me', 'best', 'latest', 'good', 'movie', 'movies', 'series', 'show', 'shows', 'recommend', 'recommendation', 'recommendations', 'suggest', 'suggestion', 'suggestions', 'similar', 'to', 'of', 'about', 'a', 'an', 'the', 'in', 'on', 'at', 'with', 'by', 'who', 'is', 'actor', 'actress', 'director', 'language', 'languages', 'dubbed', 'subtitled'];
      if (genreMatched) {
        stopWords.push(genreMatched.name.toLowerCase());
        stopWords.push(genreMatched.slug.toLowerCase());
      }
      languages.forEach(l => stopWords.push(l));
      
      const words = text.split(/\s+/).filter(word => !stopWords.includes(word) && word.length > 1);
      const searchKeyword = words.join(' ').trim();

      if (similarTitle) {
        const refMovie = await Movie.findOne({ where: { title: { [Op.like]: `%${similarTitle}%` } } }) 
          || await Series.findOne({ where: { title: { [Op.like]: `%${similarTitle}%` } } });

        const refCatId = refMovie ? refMovie.category_id : null;
        
        let suggestedMovies = [];
        let suggestedSeries = [];
        
        if (refCatId) {
          suggestedMovies = await Movie.findAll({
            where: {
              category_id: refCatId,
              id: { [Op.ne]: refMovie.id },
              status: 'published'
            },
            limit: 2
          });
          suggestedSeries = await Series.findAll({
            where: {
              category_id: refCatId,
              id: { [Op.ne]: refMovie.id },
              status: 'published'
            },
            limit: 2
          });
        }

        if (suggestedMovies.length === 0 && suggestedSeries.length === 0) {
          suggestedMovies = await Movie.findAll({ where: { is_featured: true, status: 'published' }, limit: 2 });
          suggestedSeries = await Series.findAll({ where: { is_featured: true, status: 'published' }, limit: 2 });
        }

        let reply = `Since you mentioned **${refMovie ? refMovie.title : similarTitle}**, here are some recommendations you might enjoy:\n\n`;
        if (suggestedMovies.length > 0) {
          reply += `### Movies\n`;
          suggestedMovies.forEach(m => {
            reply += `* **[${m.title}](/watch/${m.slug})**: ${m.description ? m.description.substring(0, 100) + '...' : 'Watch on StreamVault'}\n`;
          });
        }
        if (suggestedSeries.length > 0) {
          reply += `\n### Web Series\n`;
          suggestedSeries.forEach(s => {
            reply += `* **[${s.title}](/series/${s.slug})**: ${s.description ? s.description.substring(0, 100) + '...' : 'Explore on StreamVault'}\n`;
          });
        }
        return reply;
      }

      if (genreMatched) {
        let movies = [];
        let series = [];
        
        let movieIds = [];
        let seriesIds = [];
        try {
          const movieCategoryRows = await Movie.sequelize.query(
            "SELECT movie_id FROM movie_categories WHERE category_id = :categoryId",
            {
              replacements: { categoryId: genreMatched.id },
              type: Movie.sequelize.QueryTypes.SELECT
            }
          );
          movieIds = movieCategoryRows.map(r => r.movie_id);
        } catch (e) {
          console.error("Failed to query movie_categories:", e.message);
        }

        try {
          const seriesCategoryRows = await Series.sequelize.query(
            "SELECT series_id FROM series_categories WHERE category_id = :categoryId",
            {
              replacements: { categoryId: genreMatched.id },
              type: Series.sequelize.QueryTypes.SELECT
            }
          );
          seriesIds = seriesCategoryRows.map(r => r.series_id);
        } catch (e) {
          console.error("Failed to query series_categories:", e.message);
        }

        const categoryOrCondition = [
          { category_id: genreMatched.id },
          { title: { [Op.like]: `%${genreMatched.name}%` } },
          { description: { [Op.like]: `%${genreMatched.name}%` } }
        ];
        if (movieIds.length > 0) {
          categoryOrCondition.push({ id: { [Op.in]: movieIds } });
        }

        const seriesCategoryOrCondition = [
          { category_id: genreMatched.id },
          { title: { [Op.like]: `%${genreMatched.name}%` } },
          { description: { [Op.like]: `%${genreMatched.name}%` } }
        ];
        if (seriesIds.length > 0) {
          seriesCategoryOrCondition.push({ id: { [Op.in]: seriesIds } });
        }

        const movieWhereAnd = [
          { status: 'published' },
          { [Op.or]: categoryOrCondition }
        ];

        const seriesWhereAnd = [
          { status: 'published' },
          { [Op.or]: seriesCategoryOrCondition }
        ];

        if (languageFilter) {
          movieWhereAnd.push({ language: { [Op.like]: `%${languageFilter}%` } });
          seriesWhereAnd.push({ language: { [Op.like]: `%${languageFilter}%` } });
        }

        if (searchKeyword) {
          movieWhereAnd.push({
            [Op.or]: [
              { title: { [Op.like]: `%${searchKeyword}%` } },
              { description: { [Op.like]: `%${searchKeyword}%` } }
            ]
          });
          seriesWhereAnd.push({
            [Op.or]: [
              { title: { [Op.like]: `%${searchKeyword}%` } },
              { description: { [Op.like]: `%${searchKeyword}%` } }
            ]
          });
        }

        movies = await Movie.findAll({
          where: {
            [Op.and]: movieWhereAnd
          },
          limit: 3
        });

        series = await Series.findAll({
          where: {
            [Op.and]: seriesWhereAnd
          },
          limit: 3
        });

        // Fallback search across all categories if none match in the category
        if (movies.length === 0 && series.length === 0 && (searchKeyword || languageFilter)) {
          const fallbackMovieAnd = [{ status: 'published' }];
          const fallbackSeriesAnd = [{ status: 'published' }];

          if (languageFilter) {
            fallbackMovieAnd.push({ language: { [Op.like]: `%${languageFilter}%` } });
            fallbackSeriesAnd.push({ language: { [Op.like]: `%${languageFilter}%` } });
          }
          if (searchKeyword) {
            fallbackMovieAnd.push({
              [Op.or]: [
                { title: { [Op.like]: `%${searchKeyword}%` } },
                { description: { [Op.like]: `%${searchKeyword}%` } }
              ]
            });
            fallbackSeriesAnd.push({
              [Op.or]: [
                { title: { [Op.like]: `%${searchKeyword}%` } },
                { description: { [Op.like]: `%${searchKeyword}%` } }
              ]
            });
          }

          movies = await Movie.findAll({
            where: { [Op.and]: fallbackMovieAnd },
            limit: 3
          });
          series = await Series.findAll({
            where: { [Op.and]: fallbackSeriesAnd },
            limit: 3
          });
        }

        if (movies.length === 0 && series.length === 0) {
          const matchingQuery = searchKeyword
            ? `matching "${searchKeyword}"`
            : `in ${genreMatched.name}`;
          const langText = languageFilter ? ` in ${languageFilter}` : "";
          return `Currently, we don't have any published titles ${matchingQuery}${langText} on StreamVault. Try checking out our **[Library](/library)** page for all available content!`;
        }

        let reply = "";
        const langText = languageFilter ? ` **${languageFilter.charAt(0).toUpperCase() + languageFilter.slice(1)}**` : "";
        if (searchKeyword) {
          reply = `Here are${langText} titles matching **"${searchKeyword}"** on StreamVault:\n\n`;
        } else {
          reply = `Here are some popular${langText} **${genreMatched.name}** titles on StreamVault:\n\n`;
        }
          
        if (movies.length > 0) {
          reply += `### Movies\n`;
          movies.forEach(m => {
            reply += `* **[${m.title}](/watch/${m.slug})**: ${m.description ? m.description.substring(0, 100) + '...' : 'Watch on StreamVault'}\n`;
          });
        }
        if (series.length > 0) {
          reply += `\n### Web Series\n`;
          series.forEach(s => {
            reply += `* **[${s.title}](/series/${s.slug})**: ${s.description ? s.description.substring(0, 100) + '...' : 'Explore on StreamVault'}\n`;
          });
        }
        return reply;
      }

      // If we don't have a genre matched but have search keywords or language
      if (searchKeyword || languageFilter) {
        const fallbackMovieAnd = [{ status: 'published' }];
        const fallbackSeriesAnd = [{ status: 'published' }];

        if (languageFilter) {
          fallbackMovieAnd.push({ language: { [Op.like]: `%${languageFilter}%` } });
          fallbackSeriesAnd.push({ language: { [Op.like]: `%${languageFilter}%` } });
        }
        if (searchKeyword) {
          fallbackMovieAnd.push({
            [Op.or]: [
              { title: { [Op.like]: `%${searchKeyword}%` } },
              { description: { [Op.like]: `%${searchKeyword}%` } }
            ]
          });
          fallbackSeriesAnd.push({
            [Op.or]: [
              { title: { [Op.like]: `%${searchKeyword}%` } },
              { description: { [Op.like]: `%${searchKeyword}%` } }
            ]
          });
        }

        const movies = await Movie.findAll({
          where: { [Op.and]: fallbackMovieAnd },
          limit: 3
        });
        const series = await Series.findAll({
          where: { [Op.and]: fallbackSeriesAnd },
          limit: 3
        });

        if (movies.length > 0 || series.length > 0) {
          const langText = languageFilter ? ` **${languageFilter.charAt(0).toUpperCase() + languageFilter.slice(1)}**` : "";
          let reply = searchKeyword 
            ? `Here are${langText} titles matching **"${searchKeyword}"** on StreamVault:\n\n`
            : `Here are some popular${langText} titles on StreamVault:\n\n`;

          if (movies.length > 0) {
            reply += `### Movies\n`;
            movies.forEach(m => {
              reply += `* **[${m.title}](/watch/${m.slug})**: ${m.description ? m.description.substring(0, 100) + '...' : 'Watch on StreamVault'}\n`;
            });
          }
          if (series.length > 0) {
            reply += `\n### Web Series\n`;
            series.forEach(s => {
              reply += `* **[${s.title}](/series/${s.slug})**: ${s.description ? s.description.substring(0, 100) + '...' : 'Explore on StreamVault'}\n`;
            });
          }
          return reply;
        } else {
          const matchingQuery = searchKeyword
            ? `matching "${searchKeyword}"`
            : `titles`;
          const langText = languageFilter ? ` in ${languageFilter}` : "";
          return `I couldn't find any ${matchingQuery}${langText} on StreamVault. Try looking for different titles or visit the **[Library](/library)** page.`;
        }
      }

      const featuredMovies = await Movie.findAll({ where: { is_featured: true, status: 'published' }, limit: 3 });
      const featuredSeries = await Series.findAll({ where: { is_featured: true, status: 'published' }, limit: 3 });
      
      let reply = `Here are some featured recommendations on StreamVault:\n\n`;
      if (featuredMovies.length > 0) {
        reply += `### Featured Movies\n`;
        featuredMovies.forEach(m => {
          reply += `* **[${m.title}](/watch/${m.slug})**: ${m.description ? m.description.substring(0, 100) + '...' : 'Watch now'}\n`;
        });
      }
      if (featuredSeries.length > 0) {
        reply += `\n### Featured Web Series\n`;
        featuredSeries.forEach(s => {
          reply += `* **[${s.title}](/series/${s.slug})**: ${s.description ? s.description.substring(0, 100) + '...' : 'Explore now'}\n`;
        });
      }
      return reply;
    }

    return `Hello! I am **VaultAssistant**, your personal StreamVault guide. I can help you with:
1. **Movie & Series Suggestions**: Try asking *"Recommend a good action movie"* or *"What mystery series are available?"*
2. **Summarizing Plots**: Try asking *"What is Inception about?"*
3. **Customer Support**: Try asking *"How do I change my parental PIN?"* or *"What subscription plans are available?"*

How can I help you today?`;
  }
}


module.exports = new UserInteractionService();
