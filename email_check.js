const scriptProperties = PropertiesService.getScriptProperties();

function check() {
  const threads = GmailApp.search(
    "is:unread from:newsletter@filipedeschamps.com.br",
  );

  for (const thread of threads) {
    const message = thread.getMessages()[0];
    const subject = message.getSubject();
    const body = message.getPlainBody()
      .replace(/(\r\n|\n|\r)/g, "\n")
      .split("\n\n")
      .filter((section) => !section.includes("https://"))
      .map((section) => {
        const [title, ...rest] = section.replace(/\n/g, " ").split(":");
        let body = rest.join(" ").trim();

        if (body.includes("E após as notícias de hoje")) {
          body = body.split("E após as notícias de hoje")[0];
        }

        return `### ${title}\n${
          (body[0]?.toUpperCase() ?? "") + body?.slice(1)
        }`;
      })
      .reduce((sections, section) => {
        const lastSection = sections[sections.length - 1];
        const body = `${lastSection}\n\n${section}`;

        if (body.length <= 4000) {
          sections[sections.length - 1] = body;
        } else {
          sections.push(section);
        }

        return sections;
      }, [""]);

    const json = JSON.stringify(
      {
        username: "Filipe Deschamps",
        embeds: body.map((content, index) => (
          {
            color: 2829617,
            description: index === 0 ? `# ${subject}\n${content}` : content,
            timestamp: message.getDate().toISOString(),
          }
        )),
      },
      null,
      2,
    );

    const response = UrlFetchApp.fetch(
      scriptProperties.getProperty("WEBHOOK_URL"),
      {
        method: "POST",
        headers: { "Content-type": "application/json" },
        payload: json,
      },
    );

    thread.markRead();

    console.log("content text:", response.getContentText());
    console.log("response code:", response.getResponseCode());
    console.log("body:", json);
  }
}
