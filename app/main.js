const fs = require("fs");
const path = require("path");
const { stdout } = require("process");
const zlib = require("zlib");
const crypto = require("crypto");

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.log("Logs from your program will appear here!");

const command = process.argv[2];

switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "cat-file":
    catFile();
    break;
  case "hash-object":
    hashObject();
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(__dirname, ".git"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(__dirname, ".git", "refs"), { recursive: true });

  fs.writeFileSync(
    path.join(__dirname, ".git", "HEAD"),
    "ref: refs/heads/main\n"
  );
  console.log("Initialized git directory");
}

function catFile() {
  const type = process.argv[3];
  const hash = process.argv[4];
  if (!type || !hash) {
    throw new Error("Missing arguments");
  }
  if (type !== "-p") {
    throw new Error(`Unknown flag ${type}`);
  }
  const file = fs.readFileSync(
    path.join(__dirname, ".git", "objects", hash.slice(0, 2), hash.slice(2))
  );
  const decompressed = zlib.inflateSync(file);
  const contentStart = decompressed.indexOf("\x00") + 1;
  const content = decompressed.toString("utf-8", contentStart);
  process.stdout.write(content);
}

function hashObject() {
  const command = process.argv[3];
  const file = process.argv[4];
  if (!command || !file) {
    throw new Error("Missing arguments");
  }
  if (command !== "-w") {
    throw new Error(`Unknown flag ${command}`);
  }

  const hash = hashFile(file);
  process.stdout.write(hash);
}

function hashFile(file) {
  const content = fs.readFileSync(file);
  const header = `blob ${content.length}\x00`;
  const store = zlib.deflateSync(Buffer.from(header + content));
  const hash = crypto.createHash("sha1").update(store).digest("hex");
  const hashPath = path.join(__dirname, ".git", "objects", hash.slice(0, 2));
  fs.mkdirSync(hashPath, { recursive: true });
  fs.writeFileSync(path.join(hashPath, hash.slice(2)), store);
  return hash;
}
