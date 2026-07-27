(() => {
  if (!window.AI_DATA?.realCompetitionMode) return;
  const competitions = window.AI_DATA.competitions || [];
  const now = Date.now();

  competitions.forEach((item) => {
    const deadline = new Date(item.deadline).getTime();
    if (Number.isNaN(deadline)) {
      item.status = 'updated';
      return;
    }
    const days = Math.ceil((deadline - now) / 86400000);
    item.status = days < 0 ? 'ended' : days <= 10 ? 'closing' : 'ongoing';
  });

  window.AI_DATA.tracks = [...new Set(competitions.map((item) => item.track).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  window.AI_DATA.hotTags = ['AI Agent', '大学生', '个人参赛', '奖金赛事', '数据科学', '大模型应用'];
})();
