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
  {
    id: 'js-4',
    language: 'JavaScript',
    difficulty: 'medium',
    content: `class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
  emit(event, ...args) {
    (this.events[event] || []).forEach(fn => fn(...args));
  }
}`,
  },
  {
    id: 'js-5',
    language: 'JavaScript',
    difficulty: 'medium',
    content: `function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
  },
  {
    id: 'js-6',
    language: 'JavaScript',
    difficulty: 'hard',
    content: `const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const double = x => x * 2;
const addTen = x => x + 10;
const square = x => x * x;

const transform = pipe(double, addTen, square);
console.log(transform(3));`,
  },
  {
    id: 'js-7',
    language: 'JavaScript',
    difficulty: 'hard',
    content: `function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
  );
}`,
  },

  // Java extended
  {
    id: 'java-4',
    language: 'Java',
    difficulty: 'medium',
    content: `public static int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
  },
  {
    id: 'java-5',
    language: 'Java',
    difficulty: 'medium',
    content: `interface Shape {
    double area();
    double perimeter();
}

class Circle implements Shape {
    private final double radius;
    Circle(double r) { this.radius = r; }
    public double area() { return Math.PI * radius * radius; }
    public double perimeter() { return 2 * Math.PI * radius; }
}`,
  },
  {
    id: 'java-6',
    language: 'Java',
    difficulty: 'hard',
    content: `Map<String, Long> wordCount = Arrays.stream(text.split("\\s+"))
    .collect(Collectors.groupingBy(
        String::toLowerCase,
        Collectors.counting()
    ));

wordCount.entrySet().stream()
    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
    .limit(10)
    .forEach(e -> System.out.println(e.getKey() + ": " + e.getValue()));`,
  },
  {
    id: 'java-7',
    language: 'Java',
    difficulty: 'hard',
    content: `public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    public LRUCache(int cap) {
        super(cap, 0.75f, true);
        this.capacity = cap;
    }
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}`,
  },

  // Python extended
  {
    id: 'python-4',
    language: 'Python',
    difficulty: 'medium',
    content: `from functools import wraps
import time

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper`,
  },
  {
    id: 'python-5',
    language: 'Python',
    difficulty: 'medium',
    content: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]`,
  },
  {
    id: 'python-6',
    language: 'Python',
    difficulty: 'hard',
    content: `class Node:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
  },
  {
    id: 'python-7',
    language: 'Python',
    difficulty: 'hard',
    content: `from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for word in words:
        key = tuple(sorted(word))
        groups[key].append(word)
    return list(groups.values())

result = group_anagrams(["eat","tea","tan","ate","nat","bat"])`,
  },
]

export function getSnippetsByLanguage(language) {
  return snippets.filter(
    (s) => s.language.toLowerCase() === language.toLowerCase()
  )
}

export function getRandomSnippet(language) {
  const pool = getSnippetsByLanguage(language)
  return pool[Math.floor(Math.random() * pool.length)]
}
