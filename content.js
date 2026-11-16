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
                        document.getElementById("chat_message_input").style.minHeight = "400px";
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
    
    

    // const observer = new MutationObserver((mutations, obs) => {
    //     const button = document.querySelector('._status_1rpl5_7._appointed_1rpl5_22');
    //     if (button) {
    //         button.click();
    //         obs.disconnect();
    //     }
    // });
    // observer.observe(document.body, {
    //     childList: true,
    //     subtree: true
    // });




    // const mdObserver = new MutationObserver((mutations, obs) => {
    //     const eman = document.getElementById('chat_message_input');
    //     if (eman) {
    //         addRemoveMarkdown();
    //         obs.disconnect();
    //     }
    // })
    // mdObserver.observe(document.body, {
    //     childList: true,
    //     subtree: true
    // })


    function RemoveMarkdown() {
        const TARGET_ID = 'chat_message_input';
        const TARGET_PATH_RE = /^\/student\/topic\/[^/]+\/task\/[^/]+(?:\/|$)/;
        function stripFormatting() {
          const el = document.getElementById(TARGET_ID);
          if (!el) { console.warn('[strip] #' + TARGET_ID + ' not found'); return; }
          let tiny = null;
          if (window.tinymce && typeof window.tinymce.get === 'function') {
            tiny = window.tinymce.get(TARGET_ID) || null;
          }
          const sourceHtml = (tiny && typeof tiny.getContent === 'function')
            ? tiny.getContent()
            : el.innerHTML;
          const doc = new DOMParser().parseFromString(
            '<!doctype html><body>' + sourceHtml, 'text/html'
          );
          const isBlock = t => /^(p|div|li|h[1-6]|blockquote|pre|section|article|tr|hr|ul|ol|table|thead|tbody)$/i.test(t);
          const isSkip  = t => /^(script|style|noscript|template)$/i.test(t);
          let out = '';
          const ensureNewline = () => { if (out.length && !out.endsWith('\n')) out += '\n'; };
          const walk = (node) => {
            if (node.nodeType === 3) {
              const t = node.nodeValue.replace(/\u00a0/g, ' ');
              if (t.trim() === '') {
                if (out.length && !out.endsWith(' ') && !out.endsWith('\n')) out += ' ';
              } else {
                out += t;
              }
              return;
            }
            if (node.nodeType !== 1) return;
            const tag = node.tagName;
            if (isSkip(tag)) return;
            if (tag === 'BR') { out += '\n'; return; }
            if (isBlock(tag)) {
              ensureNewline();
              for (const c of node.childNodes) walk(c);
              out += '\n';
            } else {
              for (const c of node.childNodes) walk(c);
            }
          };
          for (const c of doc.body.childNodes) walk(c);
          const plain = out
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/^\n+|\n+$/g, '');
          const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const newHtml = plain.length === 0
            ? ''
            : plain.split('\n').map(line => {
                if (line.trim() === '') return '<p><br></p>';
                let safe = esc(line);
                safe = safe.replace(/^ /, '&nbsp;').replace(/ $/, '&nbsp;');
                return '<p>' + safe + '</p>';
              }).join('');
          if (tiny && typeof tiny.setContent === 'function') {
            tiny.setContent(newHtml);
          } else {
            el.innerHTML = newHtml;
            el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: plain }));
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
