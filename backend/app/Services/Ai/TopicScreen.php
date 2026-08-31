<?php

namespace App\Services\Ai;

/**
 * Server-side refusal screen.
 *
 * Mirrors frontend/lib/safety/boundaries.ts. The client copy exists to give
 * immediate feedback; this one is authoritative, because a client check can be
 * bypassed and this is the last point before text reaches a model.
 *
 * Deliberately over-inclusive: a false positive costs one redirect to a
 * clinician, a false negative costs a medical claim.
 */
class TopicScreen
{
    private const PATTERNS = [
        'diagnosis' => '/\b(do i have|am i (diabetic|hypothyroid|insulin resistant)|diagnos|is this (cancer|pcos|thyroid))\b/i',
        'disease-treatment' => '/\b(cure|treat(ing|ment)? (my|for) )\b/i',
        'medication-recommendation' => '/\b(should i (take|start|stop)|which (drug|medication)|prescribe|ozempic|wegovy|semaglutide|tirzepatide|mounjaro|metformin|phentermine|orlistat)\b/i',
        'medication-dosing' => '/\b(\d+\s?(mg|mcg|iu|units)\b|dose|dosage|titrat)/i',
        'supplement-dosing' => '/\b(how much .*(vitamin|supplement|creatine|magnesium)|\bmg of\b)/i',
        'symptom-interpretation' => '/\b(chest pain|dizzy|dizziness|fainted|palpitations|blood in|numbness|shortness of breath)\b/i',
        'contradicting-a-clinician' => '/\b(my doctor said|doctor told me|against my (doctor|dietitian))\b/i',
        'medical-emergency' => '/\b(emergency|can\'?t breathe|passed out|suicidal|harm myself|overdose)\b/i',
        'therapeutic-diet' => '/\b(renal diet|dialysis|coeliac|celiac|crohn|ulcerative colitis|gastroparesis|chemo)\b/i',
    ];

    /** @return array{allowed: bool, topics: array<string>, urgent: bool} */
    public function check(string $text): array
    {
        $topics = [];
        foreach (self::PATTERNS as $topic => $pattern) {
            if (preg_match($pattern, $text)) {
                $topics[] = $topic;
            }
        }

        return [
            'allowed' => $topics === [],
            'topics' => $topics,
            'urgent' => (bool) array_intersect($topics, ['medical-emergency', 'symptom-interpretation']),
        ];
    }
}
