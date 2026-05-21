<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Club;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // GET all categories
    public function index()
    {
        $categories = Category::orderBy('created_at', 'asc')->get();
        return response()->json($categories);
    }

    // POST create new category
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:categories,name|max:100'
        ]);

        $category = Category::create([
            'name' => $request->name
        ]);

        return response()->json([
            'message' => 'Category created successfully!',
            'category' => $category
        ], 201);
    }

    // PUT update category
    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'message' => 'Category not found.'
            ], 404);
        }

        $request->validate([
            'name' => 'required|string|unique:categories,name,' . $id . '|max:100'
        ]);

        $oldName = $category->name;

        $category->update([
            'name' => $request->name
        ]);

        // Update all clubs that had the old category name
        Club::where('category', $oldName)->update(['category' => $request->name]);

        return response()->json([
            'message' => 'Category updated successfully!',
            'category' => $category
        ]);
    }

    // DELETE category
    public function destroy($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'message' => 'Category not found.'
            ], 404);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully!'
        ]);
    }
}