<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Storage;

class SystemSettingController extends Controller
{
    // GET /api/superadmin/settings
    public function index()
    {
        $maxClubs    = SystemSetting::where('key', 'max_clubs_per_student')->first();
        $certEnabled = SystemSetting::where('key', 'certificate_enabled')->first();
        $minSessions = SystemSetting::where('key', 'min_sessions_for_cert')->first();
        $certTemplate = SystemSetting::where('key', 'certificate_template')->first();

        $templateUrl = null;
        if ($certTemplate && $certTemplate->value) {
            $templateUrl = asset('storage/' . $certTemplate->value);
        }

        return response()->json([
            'max_clubs_per_student'    => $maxClubs    ? (int)  $maxClubs->value    : 2,
            'certificate_enabled'      => $certEnabled ? (bool) $certEnabled->value : false,
            'min_sessions_for_cert'    => $minSessions ? (int)  $minSessions->value : 5,
            'certificate_template_url' => $templateUrl,
        ]);
    }

    // PUT /api/superadmin/settings
    public function update(Request $request)
    {
        $request->validate([
            'max_clubs_per_student' => 'sometimes|integer|min:1|max:10',
            'certificate_enabled'   => 'sometimes|boolean',
            'min_sessions_for_cert' => 'sometimes|integer|min:1|max:100',
        ]);

        if ($request->has('max_clubs_per_student')) {
            SystemSetting::updateOrCreate(
                ['key' => 'max_clubs_per_student'],
                ['value' => $request->max_clubs_per_student]
            );
        }

        if ($request->has('certificate_enabled')) {
            SystemSetting::updateOrCreate(
                ['key' => 'certificate_enabled'],
                ['value' => $request->certificate_enabled ? '1' : '0']
            );
        }

        if ($request->has('min_sessions_for_cert')) {
            SystemSetting::updateOrCreate(
                ['key' => 'min_sessions_for_cert'],
                ['value' => $request->min_sessions_for_cert]
            );
        }

        $maxClubs    = SystemSetting::where('key', 'max_clubs_per_student')->first();
        $certEnabled = SystemSetting::where('key', 'certificate_enabled')->first();
        $minSessions = SystemSetting::where('key', 'min_sessions_for_cert')->first();
        $certTemplate = SystemSetting::where('key', 'certificate_template')->first();

        $templateUrl = null;
        if ($certTemplate && $certTemplate->value) {
            $templateUrl = asset('storage/' . $certTemplate->value);
        }

        return response()->json([
            'message'                  => 'Settings updated successfully.',
            'max_clubs_per_student'    => $maxClubs    ? (int)  $maxClubs->value    : 2,
            'certificate_enabled'      => $certEnabled ? (bool) $certEnabled->value : false,
            'min_sessions_for_cert'    => $minSessions ? (int)  $minSessions->value : 5,
            'certificate_template_url' => $templateUrl,
        ]);
    }

    // POST /api/superadmin/certificate/template
    public function uploadTemplate(Request $request)
    {
        $request->validate([
            'certificate_template' => 'required|file|mimes:pdf|max:10240',
        ]);

        // Delete old template if exists
        $old = SystemSetting::where('key', 'certificate_template')->first();
        if ($old && $old->value) {
            Storage::disk('public')->delete($old->value);
        }

        // Store new template
        $path = $request->file('certificate_template')->store('certificates', 'public');

        SystemSetting::updateOrCreate(
            ['key' => 'certificate_template'],
            ['value' => $path]
        );

        return response()->json([
            'message'                  => 'Certificate template uploaded successfully.',
            'certificate_template_url' => asset('storage/' . $path),
        ]);
    }

    // DELETE /api/superadmin/certificate/template
    public function deleteTemplate()
    {
        $setting = SystemSetting::where('key', 'certificate_template')->first();
        if ($setting && $setting->value) {
            Storage::disk('public')->delete($setting->value);
            $setting->delete();
        }

        return response()->json(['message' => 'Certificate template removed.']);
    }
}