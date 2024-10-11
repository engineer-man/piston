(print (cut "abcdef" 1 4))

(defn test [a b [c None] [d "x"] #* e]
  [a b c d e])
(print (test 1 2))            ; => [1, 2, None, 'x', ()]
(print (test 1 2 3 4 5 6 7))  ; => [1, 2, 3, 4, (5, 6, 7)]

(import math)
(print (math.sqrt 2))

(import hyrule [inc])
(require hyrule [assoc])
(print (list (map inc [1 2 3])))
(setv d {})
(assoc d  "a" 1  "b" 2)
(print d)
