<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportCircleMember extends Model
{
    protected $fillable = ['support_circle_id', 'user_id', 'display_name', 'contribution', 'reaction'];

    public function circle(): BelongsTo
    {
        return $this->belongsTo(SupportCircle::class, 'support_circle_id');
    }
}
