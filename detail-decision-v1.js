(() => {
  const data = window.AI_DATA || {};
  const competitions = Array.isArray(data.competitions) ? data.competitions : [];
  const playbooks = Array.isArray(data.playbooks) ? data.playbooks : [];
  const playbookByCompetition = new Map(playbooks.map((item) => [item.competitionId, item]));

  const riskLabels = {
    'qualification-stage-closed': '当前资格阶段已经关闭',
    'africa-residents-only': '仅限指定非洲国家居民',
    'us-presence-required-for-finalists': '入围后必须能合法进入美国',
    'in-person-final-required': '决赛必须现场参加',
    'sensitive-health-data': '涉及受限医疗数据',
    'do-not-upload-data-to-cloud-ai': '竞赛数据不得上传至云端 AI 工具',
    'paid-entry': '需要支付报名费',
    'required-platform-stack': '必须使用指定技术栈',
    'public-github-required': '需要公开 GitHub 仓库',
    'public-code-required': '需要公开代码',
    'technical-report-required': '需要技术报告',
    'hardware-constraint': '存在明确硬件限制',
    'travel-cost-unclear': '现场差旅承担方式不明确',
    'recognition-varies-by-school': '校内认定因学校而异',
    'timezone-needs-recheck': '截止时区仍需复核',
  };
  const severeRisks = new Set([
    'qualification-stage-closed',
    'africa-residents-only',
    'us-presence-required-for-finalists',
    'in-person-final-required',
    'sensitive-health-data',
    'do-not-upload-data-to-cloud-ai',
  ]);

  function e(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function currentPath() {
    return location.hash.slice(1).split('?')[0] || '/';
  }

  function routeCompetitionId() {
    return decodeURIComponent(currentPath().split('/')[2] || '');
  }

  function daysUntil(value) {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? Math.ceil((timestamp - Date.now()) / 86400000) : null;
  }

  function collectionOf(item) {
    if (item.collection === 'practice') return 'practice';
    if (item.collection === 'archive' || item.status === 'ended') return 'archive';
    return 'current';
  }

  function hasSevereRisk(item) {
    return (item.riskFlags || []).some((flag) => severeRisks.has(flag));
  }

  function decisionFor(item) {
    const collection = collectionOf(item);
    if (collection === 'archive' || item.entryStatus === 'closed' || item.status === 'ended') {
      return {
        tone: 'stop',
        label: '当前不建议投入',
        reason: '当前报名或参赛窗口已经关闭。可以把它当作历史赛题学习，但不应继续按在办赛事投入时间。',
      };
    }
    if (item.grade === 'R') {
      return {
        tone: 'stop',
        label: '默认不推荐',
        reason: item.auditSummary || '赛事存在明显风险或价值证据不足，不建议在没有额外依据时投入。',
      };
    }
    if (item.entryStatus === 'restricted' || hasSevereRisk(item)) {
      return {
        tone: 'verify',
        label: '先确认资格再决定',
        reason: '这场比赛存在会直接改变参赛资格或交付方式的限制。先完成资格核对，再决定是否投入。',
      };
    }
    if (item.verificationStatus !== 'reviewed' || !item.grade || item.grade === 'U') {
      return {
        tone: 'verify',
        label: '先核验再决定',
        reason: '目前只完成基础收录，尚不足以支持高含金量或高投入建议。先查看主办方规则和最新截止信息。',
      };
    }
    if (['S', 'A'].includes(item.grade)) {
      return {
        tone: 'go',
        label: '建议重点考虑',
        reason: item.auditSummary || '赛事证据、履历价值和成长价值较强，且当前仍具备行动条件。',
      };
    }
    if (item.grade === 'B') {
      return {
        tone: 'consider',
        label: '适合有明确目标时投入',
        reason: item.auditSummary || '更适合作品集、技能验证或具体方向练习，不必只为奖项投入。',
      };
    }
    return {
      tone: 'practice',
      label: '适合练习，不宜重投入',
      reason: item.auditSummary || '更适合作为入门或练习机会，投入强度应与个人目标匹配。',
    };
  }

  function suitablePoints(item, playbook) {
    const points = [];
    if (item.audience) points.push(item.audience);
    if (Number(item.resumeValue) >= 4) points.push('希望为简历、升学或求职积累有辨识度经历的人');
    if (Number(item.growthValue) >= 4) points.push('希望做出可展示作品并形成真实能力证据的人');
    if (item.difficulty === '入门') points.push('第一次参加同类比赛、需要边做边学的人');
    if (item.difficulty === '专家') points.push('已经具备相关研究、工程或部署能力的人');
    if (playbook) points.push(`能按 ${playbook.durationDays} 天节奏持续推进的人`);
    return [...new Set(points)].slice(0, 3);
  }

  function unsuitablePoints(item) {
    const points = [];
    if (item.entryStatus === 'restricted') points.push('尚未确认自己符合地区、年龄、身份或阶段资格的人');
    if (item.entryStatus === 'closed' || item.status === 'ended') points.push('希望报名当前届赛事的人');
    if (item.verificationStatus !== 'reviewed') points.push('无法接受赛事信息仍需进一步核验的人');
    if (item.difficulty === '专家') points.push('没有相关技术基础，也没有搭档补足能力的人');
    if (/线下/.test(item.mode || '')) points.push('无法承担线下出席、时间或差旅要求的人');
    if (item.fee && !/免费|无|0/u.test(item.fee)) points.push('不愿承担报名费或额外参赛成本的人');
    for (const flag of item.riskFlags || []) {
      if (riskLabels[flag]) points.push(riskLabels[flag]);
    }
    if (!points.length) points.push('只想拿证书、但不愿投入真实制作和提交时间的人');
    return [...new Set(points)].slice(0, 3);
  }

  function actionSteps(item, playbook, decision) {
    const steps = [];
    if (decision.tone === 'stop') {
      steps.push('不要继续按当前届赛事投入报名和制作成本');
      steps.push('需要学习时，只复现公开赛题、数据或获奖方案');
      steps.push('回到比赛库寻找仍可报名的替代机会');
      return steps;
    }

    steps.push('打开官方规则，核对截止时间、时区和最终提交物');
    steps.push('确认资格、团队人数、费用和必须使用的技术栈');
    if (playbook?.stages?.[0]) {
      const firstTask = playbook.stages[0].tasks?.[0];
      steps.push(firstTask ? `开始路线第一项：${firstTask}` : `进入 ${playbook.durationDays} 天执行路线`);
    } else if (decision.tone === 'verify') {
      steps.push('完成核验前不要购买工具、报名服务或进行重投入开发');
    } else {
      steps.push('用 48 小时做最小验证：确定题目、交付物和一条可运行主流程');
    }
    return steps;
  }

  function decisionMeta(item, playbook) {
    const days = daysUntil(item.deadline);
    const windowText = collectionOf(item) === 'practice'
      ? '长期开放'
      : collectionOf(item) === 'archive' || days === null || days < 0
        ? '窗口已关闭'
        : `${days} 天行动窗口`;
    return [
      `${item.grade || 'U'} 级`,
      item.verificationStatus === 'reviewed' ? '赛事级审核' : '基础收录',
      windowText,
      playbook ? `${playbook.durationDays} 天路线` : '暂无完整路线',
    ];
  }

  function renderDecision(item, playbook) {
    const decision = decisionFor(item);
    const suitable = suitablePoints(item, playbook);
    const unsuitable = unsuitablePoints(item);
    const steps = actionSteps(item, playbook, decision);
    const primary = playbook
      ? `<a class="primary-button" href="#/playbooks/${encodeURIComponent(playbook.id)}">开始执行路线 →</a>`
      : item.sourceUrl
        ? `<a class="primary-button" href="${e(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">先看官方规则 ↗</a>`
        : '<a class="primary-button" href="#/competitions">寻找其他比赛 →</a>';
    const secondary = item.sourceUrl && playbook
      ? `<a class="secondary-button" href="${e(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看官方规则 ↗</a>`
      : '<a class="secondary-button" href="#/competitions?sort=recommended">比较其他机会</a>';

    return `<section class="detail-decision-panel decision-${e(decision.tone)}" data-detail-decision>
      <div class="detail-decision-top">
        <div><span class="detail-decision-kicker">30 SECOND DECISION</span><h2>${e(decision.label)}</h2><p>${e(decision.reason)}</p></div>
        <div class="detail-decision-meta">${decisionMeta(item, playbook).map((text) => `<span>${e(text)}</span>`).join('')}</div>
      </div>
      <div class="detail-decision-grid">
        <article class="decision-fit"><span>适合你，如果</span><ul>${suitable.map((point) => `<li>${e(point)}</li>`).join('')}</ul></article>
        <article class="decision-not-fit"><span>不适合你，如果</span><ul>${unsuitable.map((point) => `<li>${e(point)}</li>`).join('')}</ul></article>
      </div>
      <div class="decision-start">
        <div><span>现在怎么开始</span><ol>${steps.map((step) => `<li>${e(step)}</li>`).join('')}</ol></div>
        <div class="decision-start-actions">${primary}${secondary}</div>
      </div>
    </section>`;
  }

  function injectDecisionPanel() {
    if (!currentPath().startsWith('/competitions/')) return;
    const item = competitions.find((competition) => competition.id === routeCompetitionId());
    const main = document.querySelector('.detail-main');
    if (!item || !main || main.querySelector('[data-detail-decision]')) return;
    const playbook = playbookByCompetition.get(item.id);
    main.insertAdjacentHTML('afterbegin', renderDecision(item, playbook));
  }

  function schedule() {
    setTimeout(injectDecisionPanel, 0);
  }

  window.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('hashchange', schedule);
})();