Hello World Java project

Files:
- src/HelloWorld.java — simple Hello World program

Notes
- `javac` is silent on success; it only prints output when there are compilation errors.

Quick usage (no scripts required)

1) Compile from the `src` directory (recommended):

```
cd src
javac .\HelloWorld.java
```

If compilation succeeds there will be no output and a `HelloWorld.class` file will be created in the same directory.

2) Run from the same `src` directory:

```
java HelloWorld
```

Alternative: compile from the project root and run with the classpath pointing to `src`:

```
javac src\HelloWorld.java
java -cp src HelloWorld
```

Optional: compile to an `out` directory (keeps sources and classes separated):

```
javac -d out src\HelloWorld.java
java -cp out HelloWorld
```

If `javac` or `java` are not found, install a JDK (Adoptium or Oracle) and make sure the JDK's `bin` folder is on your PATH.