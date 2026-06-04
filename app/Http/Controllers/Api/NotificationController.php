<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // ── GET all notifications for current user ────────────────
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get()
            ->map(fn($n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'title'      => $n->title,
                'message'    => $n->message,
                'club_name'  => $n->club_name,
                'is_read'    => $n->is_read,
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => Notification::where('user_id', $user->id)->where('is_read', false)->count(),
        ]);
    }

    // ── MARK single notification as read ─────────────────────
    public function markRead(Request $request, $id)
    {
        $user = $request->user();

        Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read.']);
    }

    // ── MARK all notifications as read ───────────────────────
    public function markAllRead(Request $request)
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All marked as read.']);
    }

    // ── DELETE all notifications ──────────────────────────────
    public function clearAll(Request $request)
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)->delete();

        return response()->json(['message' => 'All notifications cleared.']);
    }
}