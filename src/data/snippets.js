export const snippets = [
  // Java
  {
    id: 'java-1',
    language: 'Java',
    difficulty: 'easy',
    content: `public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        int count = 10;
        for (int i = 0; i < count; i++) {
            System.out.println(i);
        }
    }
}`,
  },
  {
    id: 'java-2',
    language: 'Java',
    difficulty: 'medium',
    content: `public int fibonacci(int n) {
    if (n <= 1) return n;
    int a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}`,
  },
  {
    id: 'java-3',
    language: 'Java',
    difficulty: 'medium',
    content: `List<String> names = new ArrayList<>();
names.add("Alice");
names.add("Bob");
names.add("Charlie");
for (String name : names) {
    if (name.length() > 3) {
        System.out.println(name);
    }
}`,
  },

  // Python
  {
    id: 'python-1',
    language: 'Python',
    difficulty: 'easy',
    content: `def greet(name):
    message = f"Hello, {name}!"
    print(message)
    return message

names = ["Alice", "Bob", "Charlie"]
for name in names:
    greet(name)`,
  },
  {
    id: 'python-2',
    language: 'Python',
    difficulty: 'medium',
    content: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

primes = [x for x in range(100) if is_prime(x)]`,
  },
  {
    id: 'python-3',
    language: 'Python',
    difficulty: 'medium',
    content: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        return self.items.pop()`,
  },

  // JavaScript
  {
    id: 'js-1',
    language: 'JavaScript',
    difficulty: 'easy',
    content: `function reverseString(str) {
  return str.split("").reverse().join("");
}

const input = "hello world";
const output = reverseString(input);
console.log(output);`,
  },
  {
    id: 'js-2',
    language: 'JavaScript',
    difficulty: 'medium',
    content: `const debounce = (fn, delay) => {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};`,
  },
  {
    id: 'js-3',
    language: 'JavaScript',
    difficulty: 'medium',
    content: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed:", error);
    return null;
  }
}`,
  },
]

export function getSnippetsByLanguage(language) {
  return snippets.filter((s) => s.language === language)
}

export function getRandomSnippet(language) {
  const pool = getSnippetsByLanguage(language)
  return pool[Math.floor(Math.random() * pool.length)]
}
