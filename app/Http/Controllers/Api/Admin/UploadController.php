<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** Generic image upload used by admin forms (hotel galleries, tour photos, logos...). */
class UploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'image', 'max:8192'],
            'folder' => ['nullable', 'in:hotels,rooms,tours,cars,destinations,airlines,site'],
        ]);

        $path = $request->file('file')->store('uploads/'.($data['folder'] ?? 'misc'), 'public');

        return response()->json(['path' => $path, 'url' => Storage::disk('public')->url($path)], 201);
    }
}
