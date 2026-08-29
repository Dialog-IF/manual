(ns build
  (:require [babashka.process :as p]))

(defn local-build
  [kind] 
  (let [playbook (str "local-antora-playbook-" kind ".yml")]
    (p/exec  "watchexec"
             "--clear"
             "--notify"
             "--watch" (str "../" kind "/manual")
             "--watch" playbook
             "--watch" "ui-overrides"
             "--watch" "lib"
             "--debounce" "500ms"
             "npx antora --stacktrace"
             playbook)))