(() => {
    'use strict';

    const MacacOS = navigator.userAgentData.platform == "macOS";

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    function matchesTaskPath(link) {
        return /^\/student\/topic\/.*\/task\/.*$/.test(link);
    }

    function matchesTopicPath(link) {
        return /^\/student\/topic\/[^/?#]+\/?$/i.test(link);
    }
    

    function isCtrl(key) {
      if (MacacOS) {
        return key.metaKey;
      } else {
        return key.ctrlKey
      }
    }

    function removeElement(getElement) {
        new MutationObserver((mutations, obs) => {
            const element = getElement();
            if (element) {
                element.remove();
                obs.disconnect();
            }
        }).observe(document.body, {childList: true, subtree: true});
    }

    function hideElement(getElement) {
        new MutationObserver((mutations, obs) => {
            const element = getElement();
            if (element) {
                element.style.display = "none";
                obs.disconnect();
            }
        }).observe(document.body, {childList: true, subtree: true});
    }

    // ---- "Печенька+" style (client-side, see cookie-plus.css) -------------------------
    // The platform's style list lives on the Achievements page and the chosen style is
    // stored on the server, so we cannot add a real entry. Instead a card is cloned from
    // the native "Печенька" one; applying it only sets a flag in localStorage (read by
    // content_early.js and by this code) and an attribute on <html> that cookie-plus.css
    // keys off. Picking any native style clears the flag again.
    const HP_STYLE_KEY = "hp-style";
    const HP_STYLE_VALUE = "cookie-plus";
    const HP_STYLE_TESTID = "achievementIcon_style_hp_cookie_plus";
    let styleCardsInstalled = false;

    function hpStyleActive() {
        try { return localStorage.getItem(HP_STYLE_KEY) === HP_STYLE_VALUE; } catch (e) { return false; }
    }

    function hpSetStyle(on) {
        try {
            if (on) localStorage.setItem(HP_STYLE_KEY, HP_STYLE_VALUE);
            else localStorage.removeItem(HP_STYLE_KEY);
        } catch (e) { /* storage blocked: the style just won't persist */ }
        if (on) document.documentElement.setAttribute("data-hp-style", HP_STYLE_VALUE);
        else document.documentElement.removeAttribute("data-hp-style");
    }

    function setupStyleCards() {
        if (styleCardsInstalled) {
            refreshStyleCard();
            return;
        }
        styleCardsInstalled = true;

        // The list is rendered by React and can be rebuilt at any time, so re-check on DOM changes.
        let scheduled = false;
        new MutationObserver(() => {
            if (scheduled || location.pathname !== "/student/achievements") return;
            scheduled = true;
            requestAnimationFrame(() => { scheduled = false; refreshStyleCard(); });
        }).observe(document.body, { childList: true, subtree: true });

        // Choosing a native style ("Применить") switches ours off.
        document.addEventListener("click", (event) => {
            if (location.pathname !== "/student/achievements") return;
            const button = event.target.closest && event.target.closest("button");
            const card = button && button.closest('[class*="_card_"]');
            if (!card || card.dataset.hpStyleCard) return;
            if (!card.querySelector('[data-testid^="achievementIcon_style_"]')) return;
            if (hpStyleActive()) {
                hpSetStyle(false);
                setTimeout(refreshStyleCard, 50);
            }
        }, true);

        refreshStyleCard();
    }

    function refreshStyleCard() {
        const cardOf = (img) => img.closest('[class*="_card_"]');
        const natives = [...document.querySelectorAll('[data-testid^="achievementIcon_style_"]')]
            .filter((img) => img.getAttribute("data-testid") !== HP_STYLE_TESTID)
            .map(cardOf)
            .filter(Boolean);
        const base = natives.find((c) => /Печенька/.test(c.textContent));
        if (!base) return;

        let mine = document.querySelector('[data-hp-style-card]');
        if (!mine) {
            mine = base.cloneNode(true);   // clones carry no React handlers, so our button is ours alone
            mine.dataset.hpStyleCard = "1";
            mine.querySelector("img").setAttribute("data-testid", HP_STYLE_TESTID);
            mine.querySelector('[class*="_title_"]').textContent = "Стиль «Печенька+»";
            const progress = mine.querySelector('[class*="_progress_"]');
            if (progress) progress.remove();
            base.after(mine);
        } else if (mine.previousElementSibling !== base) {
            base.after(mine);
        }

        // Templates for the right-hand side, taken from the native cards.
        const buttonTpl = natives.map((c) => c.querySelector("button")).find(Boolean);
        const statusTpl = natives.map((c) => c.querySelector('p[class*="_status_"]')).find(Boolean);
        const noteTpl = natives.map((c) => c.querySelector('p[class*="_aiLabel_"]')).find(Boolean);
        const actions = mine.querySelector('[class*="_actionsContainer_"]');
        if (!actions || !buttonTpl || !statusTpl) return;

        const state = hpStyleActive() ? "on" : "off";
        if (mine.dataset.hpState === state && actions.childElementCount) return;
        mine.dataset.hpState = state;
        actions.textContent = "";
        if (state === "on") {
            const status = statusTpl.cloneNode(true);
            status.textContent = "Применён";
            status.style.color = "var(--digitalViolet)";
            actions.appendChild(status);
        } else {
            const button = buttonTpl.cloneNode(true);
            button.textContent = "Применить";
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                hpSetStyle(true);
                refreshStyleCard();
            });
            actions.appendChild(button);
        }
        if (noteTpl) {
            const note = noteTpl.cloneNode(true);
            note.textContent = "Стиль расширения Horo+, виден только вам";
            actions.appendChild(note);
        }
    }

    function main(link) {
        // document.documentElement.style.setProperty("overflow", "hidden", "important");   // breaks everything don't use
        // hideElement(() => document.getElementsByClassName("_fullRow_1542x_46")[0]);
        document.addEventListener("keydown", (event) => {
            if (event.key == "h") {
              const home_btn = document.getElementsByClassName("_button_1a0il_1 _outline_1a0il_48 _s_1a0il_17")[0];
              if (home_btn && home_btn.textContent != "Расписание") {
                home_btn.click();
              } 
            }
        });
        // fixDarkMode();
        if (link == "/student") {
            const applyStyle = () => {
                if (document.body.style.overflowX !== "hidden") {
                    document.body.style.setProperty("overflow-x", "hidden", "important");
                }
            };
            applyStyle();
            const observer = new MutationObserver(applyStyle);
            observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
            hideElement(() => document.querySelector('[data-testid="aiAssistantButton"]'));
            removeElement(() => document.getElementById("uw-main-button"));
            // hideElement(() => document.getElementsByClassName("_p1_fmg0z_5")[2]);
            // hideElement(() => document.querySelector('[data-testid="studentProgressCard"]').children[1]);
            // hideElement(() => document.querySelector('[data-testid="disciplinesCard"]').children[1]);
            
            document.addEventListener("keydown", (event) => {
                if (event.key == "Enter") {
                    document.querySelector('[data-testid="tasksStatusLink"]').click();
                }
                else if (event.key == "s") {
                    document.querySelector('[data-testid="disciplinesCard"]').click();
                }
                else if (event.key == "c") {
                    document.getElementsByClassName("_indicator_1xv8i_1")[0].click();
                }
                else if (event.key == "n") {
                    document.getElementsByClassName("_link_ejeg3_1 _root_1ovc9_25")[0].click();
                }
                else if (event.key == "t") {
                    document.querySelector('[data-testid="scheduleButton"]').click();
                }
            });
        }
        else if (link == "/student/achievements") {
            setupStyleCards();
        }
        else if (link == "/student/tasks") {
            new MutationObserver((mutations, obs) => {
                const button = document.querySelector('._status_1rpl5_7._appointed_1rpl5_22');
                if (button) {
                    button.click();
                    obs.disconnect();
                }
            }).observe(document.body, {childList: true, subtree: true});
            removeElement(() => document.querySelector('.colored._p2_fmg0z_6._bold_fmg0z_21._filterTitle_ex5fq_14'));
        }
        else if (matchesTaskPath(link)) {
            RemoveMarkdown();
            removeElement(() => document.querySelector('[data-testid="goToChatInfoPanel"]'));
            let answer_field_expanded = false;
            document.addEventListener("keydown", (event) => {
                if (isCtrl(event) && event.key === '.') {
                    if (answer_field_expanded) {
                        document.getElementById("chat_message_input").style.removeProperty("min-height");
                        answer_field_expanded = false;
                    } else {
                        document.getElementById("chat_message_input").style.minHeight = "35vh";
                        answer_field_expanded = true;
                    }
                }
            });
        } else if (matchesTopicPath(link)) {
            console.log("LOHMANOID");
            removeElement(() => document.querySelector("._content_eauu0_76"));
            removeElement(() => document.querySelector("._root_1r328_1"));
            // document.querySelector('[data-testid="taskDescriptionTabs"]');

            document.addEventListener("keydown", (event) => {
                if (event.key == "g") {
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                    function scrollman(duration = 300) {
                        const startPosition = window.scrollY;
                        const startTime = performance.now();
                        function step(currentTime) {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const ease = 1 - Math.pow(1 - progress, 3);
                            window.scrollTo(0, startPosition * (1 - ease));
                            if (progress < 1) {
                                requestAnimationFrame(step);
                            }
                        }
                        requestAnimationFrame(step);
                  }
                  scrollman(250);
                }
            });
        }
    }

    main(location.pathname);
    


    function sacrificeCards() {
      const root = document.documentElement;

      // Create the button
      const btn = document.createElement("button");
      btn.id = "toggle-btn";
      btn.className = "_button_1a0il_1 _primary_1a0il_157 _s_1a0il_17 _sendButton_6bbgf_76 _messageInputEditorSubmitButtonClassName_1si7h_26";
      document.body.appendChild(btn);
      
      function updateLabel() {
        btn.textContent = root.classList.contains("hide-targets")
          ? "Show additonal elements"
          : "Hide additional elements";
      }
      
      // Restore saved state (optional)
      const hidden = localStorage.getItem("hideTargets") === "1";
      root.classList.toggle("hide-targets", hidden);
      updateLabel();
      
      btn.addEventListener("click", () => {
        const nowHidden = root.classList.toggle("hide-targets");
        localStorage.setItem("hideTargets", nowHidden ? "1" : "0");
        updateLabel();
      });
    }

    function fixDarkMode() {
      document.documentElement.style.setProperty('--darkreader-bg--white', '#101010');
      document.documentElement.style.setProperty('--darkreader-neutral-background', '#101010');
      document.documentElement.style.setProperty('--darkreader-background-ffffff', '#101010');
      document.documentElement.style.setProperty('--darkreader-background-f4f4f7', '#101010');
      // document.documentElement.style.setProperty('--digitalViolet', '#5854a4');
      
      const style = document.createElement('style');
      style.textContent = `
        ._title_zfhk8_14 {
          color: #fdfdfd;
        }
      `;
      document.head.appendChild(style);

      console.log("linkinpark");
    }


    function RemoveMarkdown() {
        const TARGET_ID = 'chat_message_input';
        const TARGET_PATH_RE = /^\/student\/topic\/[^/]+\/task\/[^/]+(?:\/|$)/;
        function stripFormatting() {
          const el = document.getElementById('chat_message_input');
          if (!el) { console.warn('[strip] #chat_message_input not found'); return; }
          let tiny = null;
          if (window.tinymce && typeof window.tinymce.get === 'function') {
            tiny = window.tinymce.get(el.id) || null;
          }
          const sourceHtml = (tiny && typeof tiny.getContent === 'function')
            ? tiny.getContent()
            : el.innerHTML;
          const doc = new DOMParser().parseFromString(
            '<!doctype html><body>' + sourceHtml, 'text/html'
          );
          const body = doc.body;
          const UNWRAP_TAGS = new Set(['STRONG', 'B', 'EM', 'I', 'U']);
          const DROP_PROPS = new Set([
            'font-weight',
            'font-style',
            'text-decoration',
            'text-decoration-line',
          ]);
          for (const tag of UNWRAP_TAGS) {
            body.querySelectorAll(tag).forEach(node => {
              const parent = node.parentNode;
              while (node.firstChild) parent.insertBefore(node.firstChild, node);
              parent.removeChild(node);
            });
          }
          body.querySelectorAll('[style]').forEach(node => {
            let changed = false;
            for (const prop of DROP_PROPS) {
              if (node.style.getPropertyValue(prop) !== '') {
                node.style.removeProperty(prop);
                changed = true;
              }
            }
            if (node.hasAttribute('data-mce-style')) {
              let mce = node.getAttribute('data-mce-style');
              for (const prop of DROP_PROPS) {
                mce = mce.replace(new RegExp('(?:^|;)\\s*' + prop + '\\s*:[^;]*;?', 'gi'), '');
              }
              mce = mce.replace(/^;+|;+$/g, '').trim();
              if (mce) node.setAttribute('data-mce-style', mce);
              else     node.removeAttribute('data-mce-style');
            }
            if (changed && node.getAttribute('style') !== null) {
              const remaining = node.getAttribute('style').trim();
              if (remaining === '' || remaining === ';') node.removeAttribute('style');
            }
          });
          const newHtml = body.innerHTML;
          if (tiny && typeof tiny.setContent === 'function') {
            tiny.setContent(newHtml);
          } else {
            el.innerHTML = newHtml;
            el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: null }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          return newHtml;
        }
      
        function onKeyDown(ev) {
          if (ev.repeat) return;
          if (ev.code !== 'KeyX') return;
          if (!isCtrl(ev) || !ev.shiftKey || ev.altKey || ev.metaKey) return;
          if (!TARGET_PATH_RE.test(location.pathname)) return;
          const el = document.getElementById(TARGET_ID);
          if (!el) return;
          const active = document.activeElement;
          const focused = active === el || el.contains(active);
          if (!focused) return;
          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();
          stripFormatting();
        }
        document.addEventListener('keydown', onKeyDown, true);
    }



    if ("navigation" in window) {
      window.navigation.addEventListener("navigatesuccess", () => {
        main(location.pathname);
      });
    }
})();
