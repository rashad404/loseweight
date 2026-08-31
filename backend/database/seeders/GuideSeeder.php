<?php

namespace Database\Seeders;

use App\Models\Guide;
use App\Models\GuideCategory;
use Illuminate\Database\Seeder;

class GuideSeeder extends Seeder
{
    /**
     * Categories are per-language rows, because a guide written in `az` is only
     * ever shown to `az` readers - there is no translation fallback.
     */
    private array $categories = [
        'en' => [
            ['slug' => 'fundamentals', 'name' => 'Fundamentals', 'description' => 'How weight loss actually works.'],
            ['slug' => 'nutrition', 'name' => 'Nutrition', 'description' => 'What to eat, and how much.'],
            ['slug' => 'tracking', 'name' => 'Tracking & Progress', 'description' => 'Measuring what matters.'],
            ['slug' => 'treatment-options', 'name' => 'Treatment Options', 'description' => 'Medication and clinical care, explained.'],
        ],
        'az' => [
            ['slug' => 'esaslar', 'name' => 'Əsaslar', 'description' => 'Arıqlama necə işləyir.'],
            ['slug' => 'qidalanma', 'name' => 'Qidalanma', 'description' => 'Nə yemək və nə qədər.'],
        ],
        'ru' => [
            ['slug' => 'osnovy', 'name' => 'Основы', 'description' => 'Как работает снижение веса.'],
        ],
    ];

    private array $guides = [
        [
            'language' => 'en', 'category' => 'fundamentals', 'file' => 'calorie-deficit-explained',
            'title' => 'Calorie deficit explained, and why the 3,500-calorie rule is wrong',
            'excerpt' => 'How to work out a deficit that holds up, why the familiar 3,500-calorie rule overpromises, and how big yours should be.',
            'meta_description' => 'Learn how to calculate your calorie deficit with the Mifflin-St Jeor equation, why the 3,500-calorie rule overestimates weight loss, and what deficit size is sustainable.',
            'sources' => [
                ['title' => 'Hall KD et al. Quantification of the effect of energy imbalance on bodyweight. The Lancet, 2011.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/21872751/'],
                ['title' => 'Mifflin MD et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr, 1990.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/2305711/'],
                ['title' => 'NIH Body Weight Planner', 'url' => 'https://www.niddk.nih.gov/bwp'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'fundamentals', 'file' => 'weight-loss-timeline',
            'title' => 'How long weight loss actually takes',
            'excerpt' => 'Why progress slows down as you go, what weekly rate is realistic at your starting point, and how to build a timeline you will actually hit.',
            'meta_description' => 'A realistic weight loss timeline: why progress slows down, what weekly rate suits your BMI, and why the first two weeks mislead almost everyone.',
            'sources' => [
                ['title' => 'Hall KD, Chow CC. Why is the 3500 kcal per pound weight loss rule wrong? Int J Obes, 2013.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/23949615/'],
                ['title' => 'Wing RR, Phelan S. Long-term weight loss maintenance. Am J Clin Nutr, 2005.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/16002825/'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'fundamentals', 'file' => 'weight-loss-plateau',
            'title' => 'Why weight loss plateaus happen, and how to break one',
            'excerpt' => 'How to tell a real plateau from normal fluctuation, the five reasons progress stalls, and what to change first.',
            'meta_description' => 'A weight-loss plateau is usually arithmetic, not metabolism. Learn how to confirm a real plateau and the step-by-step fix, starting with recalculating at your current weight.',
            'sources' => [
                ['title' => 'Lichtman SW et al. Discrepancy between self-reported and actual caloric intake. NEJM, 1992.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/1454084/'],
                ['title' => 'Rosenbaum M, Leibel RL. Adaptive thermogenesis in humans. Int J Obes, 2010.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/20935667/'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'fundamentals', 'file' => 'tdee-explained',
            'title' => 'TDEE explained: what your body actually burns',
            'excerpt' => 'The four parts of daily energy expenditure, how to estimate yours, and how much to trust the number a calculator gives you.',
            'meta_description' => 'TDEE explained: BMR, thermic effect of food, NEAT and exercise. How to estimate your total daily energy expenditure and how accurate the estimate really is.',
            'sources' => [
                ['title' => 'Mifflin MD et al. A new predictive equation for resting energy expenditure. Am J Clin Nutr, 1990.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/2305711/'],
                ['title' => 'Levine JA. Non-exercise activity thermogenesis (NEAT). Best Pract Res Clin Endocrinol Metab, 2002.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/12468415/'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'nutrition', 'file' => 'protein-targets',
            'title' => 'How much protein you need to lose weight',
            'excerpt' => 'Why protein protects muscle in a deficit, the gram per kilogram target for your situation, and how to spread it across the day.',
            'meta_description' => 'How much protein for weight loss? Evidence-based targets of 1.6-2.2 g/kg, why to use goal weight at higher BMIs, and how to distribute protein across meals.',
            'sources' => [
                ['title' => 'Morton RW et al. Systematic review of protein supplementation and resistance training. Br J Sports Med, 2018.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/28698222/'],
                ['title' => 'Leidy HJ et al. The role of protein in weight loss and maintenance. Am J Clin Nutr, 2015.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/25926512/'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'nutrition', 'file' => 'fiber-and-weight-loss',
            'title' => 'How much fiber you need, and why it helps',
            'excerpt' => 'Most people eat half the fiber they need. Here is the target, why it helps you feel full, and how to get there without bloating.',
            'meta_description' => 'How much fiber for weight loss: target 14 g per 1,000 calories, why fiber improves fullness, soluble versus insoluble, and how to increase intake without bloating.',
            'sources' => [
                ['title' => 'Ma Y et al. Single-component versus multicomponent dietary goals. Ann Intern Med, 2015.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/25686165/'],
                ['title' => 'Reynolds A et al. Carbohydrate quality and human health. The Lancet, 2019.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/30638909/'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'tracking', 'file' => 'bmi-waist-body-fat',
            'title' => 'BMI, waist to height, or body fat: which number matters',
            'excerpt' => 'What BMI is good for, why waist to height predicts individual risk better, and which measurements are worth your time.',
            'meta_description' => 'BMI, waist to height ratio, and body fat percentage compared. Which measurement predicts health risk best, why the 0.5 waist rule works, and what to track at home.',
            'sources' => [
                ['title' => 'Ashwell M et al. Waist-to-height ratio as a screening tool. BMJ Open, 2016.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/26975935/'],
                ['title' => 'WHO expert consultation. Appropriate BMI for Asian populations. The Lancet, 2004.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/14726171/'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'tracking', 'file' => 'how-to-weigh-yourself',
            'title' => 'How to weigh yourself so the number means something',
            'excerpt' => 'Daily swings are ten times bigger than daily fat loss. Here is how to weigh yourself so the number becomes useful.',
            'meta_description' => 'How to weigh yourself correctly: why daily weight fluctuates 1-2 kg, why the 7-day rolling average is the only number worth reading, and what else to track.',
            'sources' => [
                ['title' => 'Zheng Y et al. Self-weighing in weight management: a systematic review. Obesity, 2015.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/25683820/'],
                ['title' => 'Kroke A et al. Recent weight changes and weight cycling. Int J Obes, 2002.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/12080454/'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'nutrition', 'file' => 'is-1200-calories-too-low',
            'title' => 'Is 1,200 calories too low?',
            'excerpt' => 'Where the 1,200-calorie convention came from, who it is genuinely too low for, and why a percentage rule beats a fixed number.',
            'meta_description' => 'Is 1,200 calories a day too low? Understand safe calorie floors for men and women, why a 15-25% deficit beats a fixed number, and when medical supervision is required.',
            'sources' => [
                ['title' => 'Lean MEJ et al. Primary care-led weight management for remission of type 2 diabetes (DiRECT). The Lancet, 2018.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/29221645/'],
                ['title' => 'NICE guideline CG189: Obesity identification, assessment and management.', 'url' => 'https://www.nice.org.uk/guidance/cg189'],
            ],
        ],
        [
            'language' => 'en', 'category' => 'treatment-options', 'file' => 'weight-loss-medications-overview',
            'title' => 'Weight loss medications: what the evidence shows',
            'excerpt' => 'A general overview of GLP-1 agonists and other drug classes, what trials reported, and the caveats the headlines leave out.',
            'meta_description' => 'An evidence-based overview of weight-loss medications including GLP-1 agonists: reported trial results, common side effects, regain after stopping, and questions for your doctor.',
            'sources' => [
                ['title' => 'Wilding JPH et al. Once-weekly semaglutide in adults with overweight or obesity (STEP 1). NEJM, 2021.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/33567185/'],
                ['title' => 'Jastreboff AM et al. Tirzepatide once weekly for the treatment of obesity (SURMOUNT-1). NEJM, 2022.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/35658024/'],
                ['title' => 'Wilding JPH et al. Weight regain after withdrawal of semaglutide (STEP 1 extension). Diabetes Obes Metab, 2022.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/35441470/'],
            ],
        ],
        [
            'language' => 'az', 'category' => 'esaslar', 'file' => 'kalori-defisiti',
            'title' => 'Kalori defisiti necə hesablanır',
            'excerpt' => 'Kalori defisiti nədir, Mifflin-St Jeor düsturu ilə necə hesablanır və davamlı defisit nə qədər olmalıdır.',
            'meta_description' => 'Kalori defisiti nədir və necə hesablanır? Mifflin-St Jeor düsturu, aktivlik əmsalları və təhlükəsiz arıqlama sürəti.',
            'sources' => [
                ['title' => 'Mifflin MD et al. Am J Clin Nutr, 1990.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/2305711/'],
            ],
        ],
        [
            'language' => 'az', 'category' => 'qidalanma', 'file' => 'zulal-normasi',
            'title' => 'Arıqlayarkən gündə nə qədər zülal lazımdır',
            'excerpt' => 'Zülal defisit zamanı əzələni necə qoruyur, kiloqrama görə norma nə qədərdir və gün ərzində necə bölmək lazımdır.',
            'meta_description' => 'Arıqlayarkən gündə nə qədər zülal lazımdır? 1.6-2.2 q/kq norması, hədəf çəkiyə görə hesablama və zülal mənbələri.',
            'sources' => [
                ['title' => 'Morton RW et al. Br J Sports Med, 2018.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/28698222/'],
            ],
        ],
        [
            'language' => 'ru', 'category' => 'osnovy', 'file' => 'deficit-kalorij',
            'title' => 'Дефицит калорий: как рассчитать и каким он должен быть',
            'excerpt' => 'Что такое дефицит калорий, как рассчитать его по формуле Миффлина-Сан Жеора и почему правило 3500 ккал не работает.',
            'meta_description' => 'Как рассчитать дефицит калорий: формула Миффлина-Сан Жеора, коэффициенты активности, безопасный темп снижения веса.',
            'sources' => [
                ['title' => 'Hall KD, Chow CC. Int J Obes, 2013.', 'url' => 'https://pubmed.ncbi.nlm.nih.gov/23949615/'],
            ],
        ],
    ];

    public function run(): void
    {
        $categoryIds = [];

        foreach ($this->categories as $language => $categories) {
            foreach ($categories as $i => $category) {
                $model = GuideCategory::updateOrCreate(
                    ['language' => $language, 'slug' => $category['slug']],
                    $category + ['language' => $language, 'sort_order' => $i]
                );
                $categoryIds["{$language}:{$category['slug']}"] = $model->id;
            }
        }

        foreach ($this->guides as $guide) {
            $path = database_path("seeders/content/{$guide['language']}/{$guide['file']}.html");

            if (! file_exists($path)) {
                $this->command->warn("Missing body for {$guide['file']}");

                continue;
            }

            $body = file_get_contents($path);

            Guide::updateOrCreate(
                ['language' => $guide['language'], 'slug' => $guide['file']],
                [
                    'guide_category_id' => $categoryIds["{$guide['language']}:{$guide['category']}"] ?? null,
                    'title' => $guide['title'],
                    'excerpt' => $guide['excerpt'],
                    'body' => $body,
                    // Verified facts only, from docs/author.md. Nothing here may
                    // imply US licensure, board certification, obesity-medicine
                    // specialization, or independent review.
                    'author_name' => 'Rashad Mirzayev',
                    'author_credentials' => 'Medical degree, Azerbaijan Medical University',
                    'reviewer_name' => 'Rashad Mirzayev',
                    'reviewer_credentials' => 'Physician educated in Azerbaijan with a professional background in pediatrics',
                    'review_jurisdiction' => 'Azerbaijan',
                    'us_licensed' => false,
                    // Author and reviewer are the same person, so the page must say
                    // "written and reviewed", never "independently reviewed".
                    'independent_review' => false,
                    // Only Rashad can set this, after he actually reviews the article.
                    'reviewed_at' => null,
                    'sources' => $guide['sources'],
                    // The layout's title template appends the brand; storing it here too
                    // produced "Title | LoseWeight.net | LoseWeight.net".
                    'meta_title' => $guide['title'],
                    'meta_description' => $guide['meta_description'],
                    'reading_minutes' => Guide::estimateReadingMinutes($body),
                    'status' => 'published',
                    'published_at' => now(),
                ]
            );
        }
    }
}
