package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.gacha.application.dto.GachaCreateCommand;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GachaCreateRequest(
    @NotBlank(message = "가챠 이름은 필수입니다.")
    String name,
    String caption,
    String thumbnailUrl,
    List<@NotBlank(message = "카테고리는 빈 값일 수 없습니다.")
            @Size(max = 100, message = "카테고리는 100자를 초과할 수 없습니다.") String> categories
) {
    public GachaCreateCommand toCommand() {
        return GachaCreateCommand.builder()
                .name(this.name())
                .caption(this.caption())
                .thumbnailUrl(this.thumbnailUrl())
                .categories(this.categories())
                .build();
    }
}
