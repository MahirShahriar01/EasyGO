<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Email address subscribed to deals & offers. */
class NewsletterSubscriber extends Model
{
    protected $fillable = ['email', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];
}
