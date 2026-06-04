<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class IncrementStudentYear extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'students:increment-year';

    /**
     * The console command description.
     */
    protected $description = 'Increment student year by 1 every July 1. Year 4 students stay at Year 4.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $yearMap = [
            'Year 1' => 'Year 2',
            'Year 2' => 'Year 3',
            'Year 3' => 'Year 4',
            'Year 4' => 'Year 4', // stays at Year 4
        ];

        $updated = 0;

        // ✅ Update students (role = 'student')
        foreach ($yearMap as $from => $to) {
            $count = User::where('role', 'student')
                ->where('year', $from)
                ->update(['year' => $to]);
            $updated += $count;
            $this->info("Student: $from → $to : $count updated");
        }

        // ✅ Update secretaries who are also students
        foreach ($yearMap as $from => $to) {
            $count = User::where('role', 'secretary')
                ->where('year', $from)
                ->update(['year' => $to]);
            $this->info("Secretary: $from → $to : $count updated");
        }

        $this->info("✅ Done! Total students updated: $updated");

        return Command::SUCCESS;
    }
}