If you want to clean up duplicate compiled .class files and produce a single fresh set of classes, run the provided PowerShell cleanup script from the project root.

Usage (PowerShell):
    .\cleanup.ps1

What the script does:
- Creates a `backup_classes` directory and moves any existing .class files found under `out/`, `src/out/`, or directly under `src/` into it.
- Removes the (now-empty) `out/` and `src/out/` directories.
- Compiles all .java files in `src/` with javac.
- Places the newly compiled .class files into `out/`.
- Prints a final listing of .java and .class files.

Run this if you want me to perform the cleanup but prefer to run the deletion locally yourself. If you want me to run the script here, confirm and I will execute it.