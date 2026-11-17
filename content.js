(() => {
    'use strict';

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    function matchesTaskPath(link) {
        return /^\/student\/topic\/.*\/task\/.*$/.test(link);
    }

    function matchesTopicPath(link) {
        return /^\/student\/topic\/[^/?#]+\/?$/i.test(link);
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

    function main(link) {
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
                if (event.ctrlKey && event.key === '.') {
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
          if (!ev.ctrlKey || !ev.shiftKey || ev.altKey || ev.metaKey) return;
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
